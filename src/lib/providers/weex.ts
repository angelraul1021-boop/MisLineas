import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function loookupCURPINWeeex(curp: string): Promise<LineResult> {
  const validationBody = {
    documentType: 1,
    searchData: curp,
  };

  const validationResponse = await fetch(
    "https://app.weex.mx/ServiceLayer/Legislacion?ex=getDnActiveLines",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validationBody),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Weex:",
      validationResponse.statusText,
    );

    return {
      company: "Weex",
      lines: [],
      error: "Failed to validate CURP with Weex",
    };
  }

  const validationData = await validationResponse.json();

  if (validationData.obj.dnActiveByCurpRfc.length === 0) {
    return {
      company: "Weex",
      lines: [],
      isRegistered: false,
    };
  }

  console.log(
    "[weex] registered response:",
    JSON.stringify(stripCURPs(validationData), null, 2),
  );
  return {
    company: "Weex",
    lines: [],
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
