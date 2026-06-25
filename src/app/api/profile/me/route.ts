import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import {
  COPE_CREDITS_DISCLAIMER,
  getAccountDashboard,
} from "@/lib/db/profile";
import { getOrCreateCreditAccountForUser } from "@/lib/db/credits";

export async function GET(request: Request) {
  try {
    const appUser = await requireAppUser(request);
    const account = await getOrCreateCreditAccountForUser(appUser.id);
    const dashboard = await getAccountDashboard(appUser, account);

    return NextResponse.json({
      ok: true,
      ...dashboard,
      disclaimers: {
        credits: COPE_CREDITS_DISCLAIMER,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse(error.message);
    }

    return NextResponse.json(
      { ok: false, error: "Could not load profile." },
      { status: 500 },
    );
  }
}
