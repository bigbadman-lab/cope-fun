import { NextResponse } from "next/server";
import { linkAnonymousSessionToAppUser } from "@/lib/auth/app-user";
import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import { getOrCreateCreditAccountForUser } from "@/lib/db/credits";

type SyncRequest = {
  anonymousToken?: unknown;
};

export async function POST(request: Request) {
  try {
    const appUser = await requireAppUser(request);
    const body = (await request.json()) as SyncRequest;

    const anonymousToken =
      typeof body.anonymousToken === "string" ? body.anonymousToken.trim() : "";

    if (anonymousToken) {
      await linkAnonymousSessionToAppUser(appUser.id, anonymousToken);
    }

    const account = await getOrCreateCreditAccountForUser(appUser.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: appUser.id,
        walletAddress: appUser.walletAddress,
        email: appUser.email,
        displayName: appUser.displayName,
      },
      account: {
        balanceCredits: account.balanceCredits,
        seasonPoints: account.seasonPoints,
        totalStakedCredits: account.totalStakedCredits,
        totalWonCredits: account.totalWonCredits,
        totalLostCredits: account.totalLostCredits,
        marketsEntered: account.marketsEntered,
        marketsWon: account.marketsWon,
        marketsLost: account.marketsLost,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse(error.message);
    }

    return NextResponse.json(
      { ok: false, error: "Could not sync account." },
      { status: 500 },
    );
  }
}
