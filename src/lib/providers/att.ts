import http from "http";
import https from "https";
import tls from "tls";
import type { LineResult } from "@/types";

function getProxy(): { host: string; port: number; auth?: string } | null {
  const raw = process.env.ATT_PROXIES;
  if (!raw) return null;
  const entries = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (entries.length === 0) return null;
  const entry = entries[Math.floor(Math.random() * entries.length)];
  const url = entry.startsWith("http") ? new URL(entry) : (() => {
    const [host, port, user, pass] = entry.split(":");
    return new URL(`http://${user}:${pass}@${host}:${port}`);
  })();
  return {
    host: url.hostname,
    port: parseInt(url.port),
    auth: url.username ? `${url.username}:${url.password}` : undefined,
  };
}

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

// Chrome-compatible TLS fingerprint — passes F5 Volterra WAF
const TLS_OPTS = {
  ciphers: [
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "ECDHE-ECDSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES128-GCM-SHA256",
    "ECDHE-ECDSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-ECDSA-CHACHA20-POLY1305",
    "ECDHE-RSA-CHACHA20-POLY1305",
    "ECDHE-RSA-AES128-SHA",
    "ECDHE-RSA-AES256-SHA",
    "AES128-GCM-SHA256",
    "AES256-GCM-SHA384",
    "AES128-SHA",
    "AES256-SHA",
  ].join(":"),
  ecdhCurve: "X25519:P-256:P-384",
  sigalgs:
    "ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:" +
    "ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:" +
    "rsa_pss_rsae_sha512:rsa_pkcs1_sha512",
  minVersion: "TLSv1.2" as const,
  maxVersion: "TLSv1.3" as const,
};

interface HttpResult {
  status: number;
  body: string;
  cookies: string[];
}

function httpsRequest(
  url: string,
  opts: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const proxy = getProxy();

    const onResponse = (res: http.IncomingMessage) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        return resolve(httpsRequest(res.headers.location, opts));
      }
      const cookies = ([] as string[])
        .concat(res.headers["set-cookie"] ?? [])
        .map((c) => c.split(";")[0]);
      let body = "";
      res.on("data", (d: Buffer) => (body += d));
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, body, cookies }),
      );
    };

    const reqOpts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: opts.method ?? "GET",
      headers: { "user-agent": UA, ...opts.headers },
      ...TLS_OPTS,
    };

    if (!proxy) {
      const req = https.request(reqOpts, onResponse);
      req.on("error", reject);
      if (opts.body) req.write(opts.body);
      req.end();
      return;
    }

    // CONNECT tunnel through proxy
    const connectReq = http.request({
      host: proxy.host,
      port: proxy.port,
      method: "CONNECT",
      path: `${parsed.hostname}:443`,
      headers: {
        host: `${parsed.hostname}:443`,
        ...(proxy.auth ? { "proxy-authorization": `Basic ${Buffer.from(proxy.auth).toString("base64")}` } : {}),
      },
    });

    connectReq.on("connect", (_res, socket) => {
      const tlsSocket = tls.connect({
        socket,
        servername: parsed.hostname,
        ...TLS_OPTS,
      });
      const req = https.request(
        { ...reqOpts, createConnection: () => tlsSocket, agent: false },
        onResponse,
      );
      req.on("error", reject);
      if (opts.body) req.write(opts.body);
      req.end();
    });

    connectReq.on("error", reject);
    connectReq.end();
  });
}

const COMMON_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "es-MX,es;q=0.9",
  "content-type": "application/json",
  origin: "https://att.com.mx",
  referer: "https://att.com.mx/controlpersonal/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

const MAX_ATTEMPTS = 3;

async function attempt(curp: string): Promise<LineResult | null> {
  const uuid = crypto.randomUUID();

  // Step 1: load page to get F5 session cookies
  const page = await httpsRequest("https://att.com.mx/controlpersonal/", {
    headers: {
      accept: "text/html,application/xhtml+xml,*/*",
      "accept-language": "es-MX,es;q=0.9",
    },
  });

  if (page.status !== 200) {
    console.error("AT&T: page load failed, status:", page.status);
    return null;
  }

  let cookies = page.cookies.join("; ");

  // Step 2: initlines
  const session = await httpsRequest(
    "https://att.com.mx/controlpersonal/api/session/initlines",
    {
      method: "POST",
      headers: { ...COMMON_HEADERS, ...(cookies ? { cookie: cookies } : {}) },
      body: JSON.stringify({
        operation: "sessionInitLines",
        request: { uuid, timestamp: new Date().toISOString(), msisdn: null },
      }),
    },
  );

  if (session.status !== 200) {
    console.error("AT&T: initlines failed, status:", session.status);
    return null;
  }

  const sessionData = JSON.parse(session.body) as { status: string };
  if (sessionData.status !== "SUCCESS") {
    console.error("AT&T: initlines status:", sessionData.status);
    return null;
  }

  cookies = [...page.cookies, ...session.cookies].join("; ");

  // Step 3: validatecustomer
  const validation = await httpsRequest(
    "https://att.com.mx/controlpersonal/api/validatecustomer",
    {
      method: "POST",
      headers: { ...COMMON_HEADERS, ...(cookies ? { cookie: cookies } : {}) },
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
    },
  );

  if (validation.status !== 200) {
    console.error(
      "AT&T: validatecustomer failed, status:",
      validation.status,
    );
    return null;
  }

  const validationData = JSON.parse(validation.body) as {
    status: string;
    data: {
      resultCode: string;
      countLines: number;
      customerInfo?: { associatedLines?: { phoneNumber?: string }[] };
    };
  };

  const isSuccess =
    validationData.status === "COMPLETED" ||
    validationData.status === "SUCCESS" ||
    validationData.data?.resultCode === "00";

  if (!isSuccess) {
    console.error(
      "AT&T: validatecustomer non-success:",
      JSON.stringify(validationData),
    );
    return null;
  }

  const data = validationData.data;

  if (data.countLines > 0) {
    const lines: string[] =
      data.customerInfo?.associatedLines
        ?.map((l) => l.phoneNumber)
        .filter((p): p is string => Boolean(p))
        .map((p) => `******${p.slice(-4)}`) ?? [];

    return {
      company: "AT&T",
      lines,
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  return { company: "AT&T", lines: [], isRegistered: false };
}

export async function lookupCURPInATT(curp: string): Promise<LineResult> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await attempt(curp).catch((err) => {
      console.error(`AT&T attempt ${i + 1} threw:`, err);
      return null;
    });
    if (result !== null) return result;
    console.error(`AT&T attempt ${i + 1} failed, retrying...`);
  }

  return {
    company: "AT&T",
    lines: [],
    error: "Failed to validate customer with AT&T",
  };
}
