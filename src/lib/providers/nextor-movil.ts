import { ProxyAgent, fetch as undiciFetch } from "undici";
import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { getResidentialProxyUrl } from "@/lib/proxy";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = getResidentialProxyUrl();
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

export async function lookupCURPINNextorMovil(
  curp: string,
): Promise<LineResult> {
  const authResponse = await undiciFetch(
    "https://vinculacion.nextormovil.mx/api/consulta/iniciar",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      dispatcher: getProxyAgent(),
    },
  );

  if (!authResponse.ok) {
    const errorData = (await authResponse.json()) as { code?: string };

    if (errorData.code === "IP_RATE_LIMIT") {
      console.warn(
        "Nextor Movil rate limit hit. Returning rate limit error.",
        errorData,
      );
      return {
        company: "Nextor Movil",
        lines: [],
        error: "Nextor Movil rate limit exceeded. Please try again later.",
      };
    }

    return {
      company: "Nextor Movil",
      lines: [],
      error: "Failed to initiate session with Nextor Movil",
    };
  }

  const authData = (await authResponse.json()) as { sessionId?: string };
  const sessionId = authData.sessionId;

  const validationBody = {
    tipo: "curp",
    valor: curp,
  };

  const validationHeaders = {
    "X-Session-Id": sessionId,
    "Content-Type": "application/json",
  };

  const validationResponse = await undiciFetch(
    "https://vinculacion.nextormovil.mx/api/consulta/pre-check",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: validationHeaders,
      body: JSON.stringify(validationBody),
      dispatcher: getProxyAgent(),
    },
  );

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Nextor Movil: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Nextor Movil",
      lines: [],
      error: "Failed to validate CURP with Nextor Movil",
    };
  }

  const validationData = (await validationResponse.json()) as {
    encontrado?: boolean;
  };

  if (validationData.encontrado) {
    console.log(
      "[nextor-movil] registered response:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "Nextor Movil",
      lines: [],
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  return {
    company: "Nextor Movil",
    lines: [],
    isRegistered: false,
  };
}
