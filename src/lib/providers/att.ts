import type { Page, Browser } from "puppeteer-core";
import type { LineResult } from "@/types";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

function getProxy(): string | null {
  const raw = process.env.ATT_PROXIES;
  if (!raw) return null;
  const entries = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (entries.length === 0) return null;
  const entry = entries[Math.floor(Math.random() * entries.length)];
  if (entry.startsWith("http")) return entry;
  const [host, port, user, pass] = entry.split(":");
  return `http://${user}:${pass}@${host}:${port}`;
}

async function launchBrowser(proxy: string | null): Promise<Browser> {
  const { default: puppeteer } = await import("puppeteer-core");

  const proxyArg = proxy ? [`--proxy-server=${new URL(proxy).origin}`] : [];
  const baseArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--window-size=1280,800",
    "--disable-blink-features=AutomationControlled",
    `--user-agent=${UA}`,
    ...proxyArg,
  ];

  if (process.env.NODE_ENV === "development") {
    const executablePath = process.env.CHROME_PATH ?? "/usr/bin/chromium";
    return puppeteer.launch({ executablePath, headless: true, args: baseArgs });
  }

  const { default: chromium } = await import("@sparticuz/chromium-min");
  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar",
  );

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [...chromium.args, ...baseArgs],
  });
}

// ── Browser pool ─────────────────────────────────────────────────────────────
// Each slot holds a warmed-up page with Shape already initialized.
// Once the page has handled MAX_PAGE_USES requests, it gets recycled so Shape
// tokens don't go stale.

const MAX_PAGE_USES = 50;
const POOL_SIZE = 2;
const PAGE_TTL_MS = 5 * 60 * 1000; // recycle after 5 min regardless of use count

interface PoolSlot {
  page: Page;
  browser: Browser;
  uses: number;
  createdAt: number;
  busy: boolean;
}

const pool: PoolSlot[] = [];
const waitQueue: Array<() => void> = [];

async function warmPage(proxy: string | null): Promise<PoolSlot> {
  const browser = await launchBrowser(proxy);
  const page = await browser.newPage();

  if (proxy) {
    const proxyUrl = new URL(proxy);
    await page.authenticate({
      username: decodeURIComponent(proxyUrl.username),
      password: decodeURIComponent(proxyUrl.password),
    });
  }

  await page.setBypassCSP(true);

  // Evasions to prevent Shape Security from detecting headless Chrome
  await page.evaluateOnNewDocument(() => {
    delete Object.getPrototypeOf(navigator).webdriver;
    Object.defineProperty(window, "chrome", {
      writable: true, enumerable: true, configurable: false,
      value: { runtime: {} },
    });
    Object.defineProperty(navigator, "languages", { get: () => ["es-MX", "es", "en-US", "en"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
  });

  // Block cosmetic resources — scripts must pass so Shape initializes
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font", "media", "other"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto("https://att.com.mx/controlpersonal/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  // Shape is ready by networkidle2 — no extra wait needed
  return { page, browser, uses: 0, createdAt: Date.now(), busy: false };
}

async function destroySlot(slot: PoolSlot) {
  try {
    await slot.browser.close();
  } catch {
    // ignore
  }
}

async function acquirePage(): Promise<PoolSlot> {
  // Find a free, non-expired slot
  for (const slot of pool) {
    if (!slot.busy && slot.uses < MAX_PAGE_USES && Date.now() - slot.createdAt < PAGE_TTL_MS) {
      slot.busy = true;
      return slot;
    }
  }

  // If pool isn't full yet, spin up a new slot immediately
  if (pool.length < POOL_SIZE) {
    const proxy = getProxy();
    const slot = await warmPage(proxy);
    slot.busy = true;
    pool.push(slot);
    return slot;
  }

  // Pool full and all busy — wait for one to free up
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  return acquirePage();
}

function recycleSlot(slot: PoolSlot) {
  const idx = pool.indexOf(slot);
  if (idx !== -1) pool.splice(idx, 1);
  destroySlot(slot);

  // Pre-warm a replacement in the background
  const proxy = getProxy();
  warmPage(proxy)
    .then((newSlot) => pool.push(newSlot))
    .catch((err) => console.warn("AT&T: pool warm-up failed:", err));
}

function releasePage(slot: PoolSlot, forceRecycle = false) {
  slot.uses++;
  const expired = forceRecycle || slot.uses >= MAX_PAGE_USES || Date.now() - slot.createdAt >= PAGE_TTL_MS;

  if (expired) {
    recycleSlot(slot);
  } else {
    slot.busy = false;
  }

  // Wake next waiter
  waitQueue.shift()?.();
}

// ── Query ─────────────────────────────────────────────────────────────────────

interface ATTResult {
  status: string;
  data: {
    resultCode: string;
    countLines: number;
    customerInfo?: { associatedLines?: { phoneNumber?: string }[] };
  };
}

async function query(curp: string): Promise<LineResult | null> {
  const slot = await acquirePage();
  let forceRecycle = false;

  try {
    const result = await slot.page.evaluate(async (curp: string) => {
      const uuid = crypto.randomUUID();
      const h = {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
      };

      const sessionRes = await fetch("/controlpersonal/api/session/initlines", {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          operation: "sessionInitLines",
          request: { uuid, timestamp: new Date().toISOString(), msisdn: null },
        }),
      });

      if (!sessionRes.ok) return { error: `initlines ${sessionRes.status}` };

      const sessionData = (await sessionRes.json()) as { status: string };
      if (sessionData.status !== "SUCCESS") {
        return { error: `initlines status: ${sessionData.status}` };
      }

      const validationRes = await fetch("/controlpersonal/api/validatecustomer", {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          operation: "validateCustomer",
          request: {
            uuid,
            timestamp: new Date().toISOString(),
            idDoc: "DOC01",
            identificationId: curp,
            sourceSystem: "SS01",
          },
        }),
      });

      if (!validationRes.ok) {
        return { error: `validatecustomer ${validationRes.status}` };
      }

      return { data: await validationRes.json() };
    }, curp);

    if ("error" in result) {
      console.error("AT&T:", result.error);
      // 403 on a warmed page means Shape session expired — recycle
      if (typeof result.error === "string" && result.error.includes("403")) {
        forceRecycle = true;
      }
      return null;
    }

    const validationData = result.data as ATTResult;

    const isSuccess =
      validationData.status === "COMPLETED" ||
      validationData.status === "SUCCESS" ||
      validationData.data?.resultCode === "00";

    if (!isSuccess) {
      console.error("AT&T: non-success:", JSON.stringify(validationData));
      return null;
    }

    const data = validationData.data;

    if (data.countLines > 0) {
      const lines: string[] =
        data.customerInfo?.associatedLines
          ?.map((l) => l.phoneNumber)
          .filter((p): p is string => Boolean(p))
          .map((p) => `******${p.slice(-4)}`) ?? [];

      return { company: "AT&T", lines, isRegistered: true, rawApiResponse: validationData };
    }

    return { company: "AT&T", lines: [], isRegistered: false };
  } catch (err) {
    // Browser crashed (e.g. proxy IP rotation broke the connection) — recycle
    forceRecycle = true;
    throw err;
  } finally {
    releasePage(slot, forceRecycle);
  }
}

// Pre-warm the pool as soon as this module loads so the first real request
// doesn't pay the ~15s browser startup cost.
warmPage(getProxy())
  .then((slot) => pool.push(slot))
  .catch((err) => console.warn("AT&T: initial warm-up failed:", err));

const MAX_ATTEMPTS = 3;

export async function lookupCURPInATT(curp: string): Promise<LineResult> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await query(curp).catch((err) => {
      console.warn(`AT&T attempt ${i + 1} threw:`, err);
      return null;
    });
    if (result !== null) return result;
    console.warn(`AT&T attempt ${i + 1} failed, retrying...`);
  }

  return { company: "AT&T", lines: [], error: "Failed to validate customer with AT&T" };
}
