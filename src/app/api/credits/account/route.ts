import { NextResponse } from "next/server";
import { getOrCreateCreditAccount } from "@/lib/db/credits";

function getAnonymousToken(request: Request): string {
  const { searchParams } = new URL(request.url);
  return (searchParams.get("anonymousToken") ?? "").trim();
}

export async function GET(request: Request) {
  try {
    const anonymousToken = getAnonymousToken(request);

    if (!anonymousToken) {
      return NextResponse.json(
        { ok: false, error: "Anonymous session required." },
        { status: 401 },
      );
    }

    const account = await getOrCreateCreditAccount(anonymousToken);

    return NextResponse.json({
      ok: true,
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
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not load credit account." },
      { status: 500 },
    );
  }
}
