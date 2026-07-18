export const runtime = "edge";

import type { NextRequest } from "next/server";
import { z } from "zod";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import type { ExportEvidencePayload, ExportIntegrity } from "@/types";

const exportPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.literal("mislineas"),
  curp: z.string().min(1),
  generatedAt: z.string().min(1),
  generatedAtLocal: z.string().min(1),
  queryTime: z.string().nullable(),
  queryTimeLocal: z.string().nullable(),
  scannedCount: z.number().int().min(0),
  totalResults: z.number().int().min(0),
  lines: z.array(
    z.object({
      operadora: z.string(),
      numero: z.string(),
      estado: z.enum([
        "confirmada",
        "posible",
        "sin_registro",
        "error",
        "no_disponible",
      ]),
      disclaimer: z.string().optional(),
    }),
  ),
});

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`);

  return `{${entries.join(",")}}`;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return toBase64(new Uint8Array(signature));
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const body = await req.json().catch(() => null);
  const parsed = exportPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid export payload" },
      { status: 400, headers: cors },
    );
  }

  const payload = parsed.data as ExportEvidencePayload;
  const canonicalPayload = canonicalize(payload);
  const payloadSha256 = await sha256Hex(canonicalPayload);
  const signedAt = new Date().toISOString();
  const secret = process.env.EXPORT_SIGNING_SECRET;
  const keyId = process.env.EXPORT_SIGNING_KEY_ID || "local-unsigned";

  let integrity: ExportIntegrity;

  if (!secret) {
    integrity = {
      signed: false,
      algorithm: "HMAC-SHA-256",
      payloadSha256,
      signature: null,
      signedAt,
      keyId,
    };
  } else {
    const signature = await signPayload(`${signedAt}.${payloadSha256}`, secret);

    integrity = {
      signed: true,
      algorithm: "HMAC-SHA-256",
      payloadSha256,
      signature,
      signedAt,
      keyId,
    };
  }

  return Response.json(integrity, { headers: cors });
}
