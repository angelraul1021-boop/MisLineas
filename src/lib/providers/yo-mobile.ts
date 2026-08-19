import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

const execFileAsync = promisify(execFile);

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

// Cloudflare's managed challenge on play.prod.yomobile.xyz fingerprints
// Node's fetch/undici and blocks it outright (403) regardless of IP or
// headers — confirmed by testing the identical request through both a
// residential Mexican proxy and no proxy at all: undici always got 403,
// plain curl always got 200. curl-impersonate's TLS fingerprint doesn't fool
// it either, so this shells out to the real curl binary via execFile (argv
// array, no shell — the CURP never touches a shell string).
export async function lookupCURPINYoMobile(curp: string): Promise<LineResult> {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-s",
        "--max-time",
        String(Math.ceil(PROVIDER_TIMEOUT_MS / 1000)),
        `https://play.prod.yomobile.xyz/api/v1.0/crm/lines/by-personal-id/${curp}/`,
        "-H",
        "accept: application/json",
        "-H",
        "origin: https://mx.yomobile.com",
        "-H",
        "referer: https://mx.yomobile.com/",
        "-H",
        "x-platform: yo",
        "-H",
        `user-agent: ${UA}`,
      ],
      { timeout: PROVIDER_TIMEOUT_MS },
    );

    const validationData = JSON.parse(stdout) as { count?: number };

    if (validationData.count === 0) {
      return {
        company: "Yo Mobile",
        lines: [],
        isRegistered: false,
      };
    }

    console.log(
      "[yo-mobile] registered response:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "Yo Mobile",
      lines: [],
      isRegistered: true,
      rawApiResponse: validationData,
    };
  } catch (e) {
    console.error("Failed to validate CURP with Yo Mobile:", e);
    return {
      company: "Yo Mobile",
      lines: [],
      error: "Failed to validate CURP with Yo Mobile",
    };
  }
}
