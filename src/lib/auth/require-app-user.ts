import "server-only";
import { NextResponse } from "next/server";
import { getOrCreateAppUser, type AppUser } from "./app-user";
import { verifyPrivyRequest } from "./privy";

export class UnauthorizedError extends Error {
  constructor(message = "Sign in required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAppUser(request: Request): Promise<AppUser> {
  const auth = await verifyPrivyRequest(request);
  if (!auth) {
    throw new UnauthorizedError(
      "Sign in to receive COPE Credits and enter markets.",
    );
  }

  return getOrCreateAppUser(auth);
}

export function unauthorizedResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: message ?? "Sign in required.",
    },
    { status: 401 },
  );
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}
