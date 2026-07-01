import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInMegamovil(curp: string): Promise<LineResult> {
  const sessionResponse = await fetch(
    "https://consultavinculacion.megamovil.mx",
  );

  if (!sessionResponse.ok) {
    return {
      company: "Mega Móvil",
      lines: [],
      error: "Failed to establish session with Mega Móvil",
    };
  }

  const cookies = sessionResponse.headers.getSetCookie().join(";");

  const validationResponse = await fetch(
    `https://consultavinculacion.megamovil.mx/validaCURP?curp=${curp}`,
    { headers: { Cookie: cookies } },
  );

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Mega Móvil: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Mega Móvil",
      lines: [],
      error: "Failed to validate CURP with Mega Móvil",
    };
  }

  const validationData = await validationResponse.json();

  if (
    validationData.message ===
      "La CURP ingresada no cuenta con líneas Mega móvil vinculadas." ||
    validationData.status === "ERROR"
  ) {
    return {
      company: "Mega Móvil",
      lines: [],
      isRegistered: false,
    };
  }

  const registeredLines = await fetch(
    "https://consultavinculacion.megamovil.mx/list.jsp",
    { headers: { Cookie: cookies } },
  );

  if (!registeredLines.ok) {
    console.error(
      `Failed to fetch registered lines from Mega Móvil: ${registeredLines.status}`,
    );
    return {
      company: "Mega Móvil",
      lines: [],
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  const htmlResponse = await registeredLines.text();
  const lines = htmlResponse.match(/(\*{6}\d{4})/g);

  if (!lines) {
    console.log("[megamovil] no lines found in HTML response");
  }

  console.log(
    "[megamovil] registered response:",
    JSON.stringify(stripCURPs(validationData), null, 2),
  );

  return {
    company: "Mega Móvil",
    lines: lines ?? [],
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
