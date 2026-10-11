import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site-config";

export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex", ...(status === 429 ? { "Retry-After": "900" } : {}) } });
}
export function failure(error: unknown) {
  return error instanceof RequestError ? json({ error: error.message }, error.status)
    : json({ error: "El servicio no está disponible en este momento. Inténtalo de nuevo." }, 503);
}
export function appOrigin(request: Request) {
  const url = new URL(request.url);
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return url.origin;
  return new URL(process.env.APP_ORIGIN || SITE_URL).origin;
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== appOrigin(request) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestError(403, "La solicitud no está permitida. Recarga la página.");
  }
}
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RequestError(415, "Formato de solicitud no válido.");
  if (Number(request.headers.get("content-length")) > 16000) throw new RequestError(413, "El formulario es demasiado largo.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Completa el formulario.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) { await reader.cancel(); throw new RequestError(413, "El formulario es demasiado largo."); }
    chunks.push(value);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error();
    return value;
  } catch { throw new RequestError(400, "El formulario no tiene un formato válido."); }
}
export function field(data: Record<string, unknown>, key: string, min: number, max: number, trim = true) {
  if (typeof data[key] !== "string") throw new RequestError(400, "Revisa los campos del formulario.");
  const value = trim ? data[key].trim() : data[key];
  if (value.length < min || value.length > max || value.includes("\0")) throw new RequestError(400, "Revisa la longitud de los campos del formulario.");
  return value;
}
export const validUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const validEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function fingerprint(scope: string, value: string) {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Missing server configuration");
  return createHmac("sha256", key).update(`${scope}:${value}`).digest("hex");
}
export function networkId(request: Request) {
  // Vercel overwrites this header. Other hosts share a conservative fallback
  // until a trusted reverse-proxy IP source is explicitly configured.
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : undefined;
  return fingerprint("network", ip && isIP(ip) ? ip : "shared-network");
}
export const visitorCookie = "museum-visitor";
export function visitorId(request: NextRequest) {
  const value = request.cookies.get(visitorCookie)?.value || "";
  const [id, signature] = value.split(".");
  if (validUuid(id || "") && /^[a-f0-9]{64}$/.test(signature || "") && timingSafeEqual(Buffer.from(signature), Buffer.from(fingerprint("visitor-cookie", id)))) return id;
  return null;
}
export function issueVisitor(response: NextResponse, id: string = randomUUID()) {
  response.cookies.set(visitorCookie, `${id}.${fingerprint("visitor-cookie", id)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 * 30 });
}
