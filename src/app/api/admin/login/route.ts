import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminCookieOptions,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin/auth";

type LoginRequest = {
  password?: unknown;
};

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Admin access is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as LoginRequest;
    const password = typeof body.password === "string" ? body.password : "";

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { ok: false, error: "Invalid password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      ADMIN_COOKIE_NAME,
      createAdminSessionToken(),
      getAdminCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not sign in." },
      { status: 500 },
    );
  }
}
