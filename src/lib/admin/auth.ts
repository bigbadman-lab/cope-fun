import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "cope-admin-auth";
const ADMIN_SESSION_VERSION = "admin-session-v1";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET?.trim());
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    throw new Error("ADMIN_SECRET is not configured.");
  }
  return secret;
}

export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  return createHash("sha256")
    .update(`${secret}:${ADMIN_SESSION_VERSION}`)
    .digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminConfigured()) return false;

  const secret = getAdminSecret();
  const provided = createHash("sha256").update(password).digest();
  const expected = createHash("sha256").update(secret).digest();

  return timingSafeEqual(provided, expected);
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || !isAdminConfigured()) return false;

  try {
    const expected = createAdminSessionToken();
    if (token.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}
