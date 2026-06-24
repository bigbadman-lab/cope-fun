import "server-only";
import { createHash } from "node:crypto";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return "unknown";
}

export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function getOptionalAnonymousToken(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const token = (body as { anonymousToken?: unknown }).anonymousToken;
  return typeof token === "string" ? token.trim() : "";
}
