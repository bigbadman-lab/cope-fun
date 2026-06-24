import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import {
  closeMarket,
  publishMarket,
} from "@/lib/db/market-admin";
import {
  settleMarketResolution,
  settleMarketVoid,
} from "@/lib/db/market-settlement";
import type { MarketSide } from "@/lib/markets/types";

const ADMIN_MARKET_ACTIONS = new Set([
  "publish",
  "close",
  "resolve",
  "void",
]);

type MarketActionRequest = {
  action?: unknown;
  outcome?: unknown;
  resolutionNotes?: unknown;
};

function isMarketSide(value: unknown): value is MarketSide {
  return value === "believe" || value === "cope";
}

type RouteContext = {
  params: Promise<{ marketId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { marketId } = await context.params;
    const body = (await request.json()) as MarketActionRequest;

    if (
      typeof body.action !== "string" ||
      !ADMIN_MARKET_ACTIONS.has(body.action)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid market action." },
        { status: 400 },
      );
    }

    const notes =
      typeof body.resolutionNotes === "string"
        ? body.resolutionNotes
        : undefined;

    let market = null;

    if (body.action === "publish") {
      market = await publishMarket(marketId);
    } else if (body.action === "close") {
      market = await closeMarket(marketId);
    } else if (body.action === "resolve") {
      if (!isMarketSide(body.outcome)) {
        return NextResponse.json(
          { ok: false, error: "Outcome must be believe or cope." },
          { status: 400 },
        );
      }
      market = await settleMarketResolution({
        marketId,
        outcome: body.outcome,
        resolutionNotes: notes,
      });
    } else if (body.action === "void") {
      market = await settleMarketVoid({
        marketId,
        resolutionNotes: notes,
      });
    }

    if (!market) {
      return NextResponse.json(
        { ok: false, error: "Market not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, market });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update market.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
