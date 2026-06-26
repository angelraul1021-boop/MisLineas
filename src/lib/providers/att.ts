import { ProxyAgent, fetch as undiciFetch } from "undici";
import type { LineResult } from "@/types";

function getProxiedFetch(): typeof undiciFetch {
  const raw = process.env.ATT_PROXIES;
  if (!raw) return undiciFetch;

  const proxies = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (proxies.length === 0) return undiciFetch;

  const entry = proxies[Math.floor(Math.random() * proxies.length)];
  const url = entry.startsWith("http") ? entry : (() => {
    const [host, port, user, pass] = entry.split(":");
    return `http://${user}:${pass}@${host}:${port}`;
  })();
  const dispatcher = new ProxyAgent(url);

  return (url, init) => undiciFetch(url, { ...init, dispatcher });
}

const MAX_ATTEMPTS = 3;

async function attempt(curp: string): Promise<LineResult | null> {
  const uuid = crypto.randomUUID();
  const proxiedFetch = getProxiedFetch();

  const BASE_HEADERS = {
    "Content-Type": "application/json",
    "origin": "https://att.com.mx",
    "referer": "https://att.com.mx/controlpersonal/",
  };

  const sessionResponse = await proxiedFetch(
    "https://att.com.mx/controlpersonal/api/session/initlines",
    {
      method: "POST",
      headers: BASE_HEADERS,
      body: JSON.stringify({
        operation: "sessionInitLines",
        request: { uuid, timestamp: new Date().toISOString(), msisdn: null },
      }),
    },
  );

  if (!sessionResponse.ok) return null;

  const sessionData = await sessionResponse.json() as { status: string };
  if (sessionData.status !== "SUCCESS") return null;

  const cookies = sessionResponse.headers
    .getSetCookie()
    .map((c: string) => c.split(";")[0])
    .join("; ");

  const validationResponse = await proxiedFetch(
    "https://att.com.mx/controlpersonal/api/validatecustomer",
    {
      method: "POST",
      headers: { ...BASE_HEADERS, cookie: cookies },
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

  if (!validationResponse.ok) return null;

  const validationData = await validationResponse.json() as {
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
      "AT&T customer validation returned non-completed status:",
      JSON.stringify(validationData, null, 2),
    );
    return null;
  }

  const data = validationData.data;

  if (data.countLines > 0) {
    const lines: string[] =
      data.customerInfo?.associatedLines
        ?.map((l: { phoneNumber?: string }) => l.phoneNumber)
        .filter((p: string | undefined): p is string => Boolean(p))
        .map((p: string) => `******${p.slice(-4)}`) ?? [];

    return { company: "AT&T", lines, isRegistered: true, rawApiResponse: validationData };
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
    console.error(`AT&T attempt ${i + 1} failed, retrying with different proxy...`);
  }

  return { company: "AT&T", lines: [], error: "Failed to validate customer with AT&T" };
}
