import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInMegamovil(curp: string): Promise<LineResult> {
  const sessionResponse = await fetch(
    "https://consultavinculacion.megamovil.mx",
  );
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
      `Failed to validate CURP with Megamovil: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Megamovil",
      lines: [],
      error: "Failed to validate CURP with Megamovil",
    };
  }

  const validationData = await validationResponse.json();

  if (
    validationData.message ===
      "La CURP ingresada no cuenta con líneas Mega móvil vinculadas." ||
    validationData.status === "ERROR"
  ) {
    return {
      company: "Megamovil",
      lines: [],
      isRegistered: false,
    };
  }

  const registeredLines = await fetch(
    "https://consultavinculacion.megamovil.mx/list.jsp",
    {
      headers: { Cookie: cookies },
    },
  );

  const htmlResponse = await registeredLines.text();
  const lines = htmlResponse.match(/(\*{6}\d{4})/g);
  console.log(
    "[megamovil] registered response:",
    JSON.stringify(stripCURPs(validationData), null, 2),
  );

  return {
    company: "Megamovil",
    lines: lines ?? [],
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
