import "server-only";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export async function requireAdminApiAuth(): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  return null;
}
