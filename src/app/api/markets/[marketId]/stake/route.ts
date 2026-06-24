import { NextResponse } from "next/server";
import { isAllowedStakeAmount, stakeOnMarketForUser } from "@/lib/db/market-staking";
import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import type { MarketSide } from "@/lib/markets/types";

type StakeRequest = {
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
    const appUser = await requireAppUser(request);
    const { marketId } = await context.params;
    const body = (await request.json()) as StakeRequest;

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

    const result = await stakeOnMarketForUser({
      marketId,
      userId: appUser.id,
      side: body.side,
      stakeCredits: body.stakeCredits,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse(error.message);
    }

    const message =
      error instanceof Error ? error.message : "Could not place stake.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
