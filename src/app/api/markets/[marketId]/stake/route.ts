import { NextResponse } from "next/server";
import { isAllowedStakeAmount, stakeOnMarket } from "@/lib/db/market-staking";
import type { MarketSide } from "@/lib/markets/types";

type StakeRequest = {
  anonymousToken?: unknown;
  side?: unknown;
  stakeCredits?: unknown;
};

function isMarketSide(value: unknown): value is MarketSide {
  return value === "believe" || value === "cope";
}

type RouteContext = {
  params: Promise<{ marketId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { marketId } = await context.params;
    const body = (await request.json()) as StakeRequest;

    const anonymousToken =
      typeof body.anonymousToken === "string" ? body.anonymousToken.trim() : "";

    if (!anonymousToken) {
      return NextResponse.json(
        { ok: false, error: "Anonymous session required." },
        { status: 401 },
      );
    }

    if (!isMarketSide(body.side)) {
      return NextResponse.json(
        { ok: false, error: "Side must be believe or cope." },
        { status: 400 },
      );
    }

    if (
      typeof body.stakeCredits !== "number" ||
      !Number.isInteger(body.stakeCredits) ||
      !isAllowedStakeAmount(body.stakeCredits)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid stake amount." },
        { status: 400 },
      );
    }

    const result = await stakeOnMarket({
      marketId,
      anonymousToken,
      side: body.side,
      stakeCredits: body.stakeCredits,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not place stake.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
