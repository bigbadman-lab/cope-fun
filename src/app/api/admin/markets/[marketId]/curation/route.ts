import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { updateMarketCuration } from "@/lib/db/market-admin";
import {
  parseDisplayOrder,
  parseIsFeatured,
  parseSeasonMarketId,
} from "@/lib/markets/season-curation";

type CurationRequest = {
  seasonId?: unknown;
  displayOrder?: unknown;
  isFeatured?: unknown;
};

type RouteContext = {
  params: Promise<{ marketId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { marketId } = await context.params;
    const body = (await request.json()) as CurationRequest;

    let seasonId: string;
    let displayOrder: number | null;
    let isFeatured: boolean;

    try {
      seasonId = parseSeasonMarketId(body.seasonId);
      displayOrder = parseDisplayOrder(body.displayOrder);
      isFeatured = parseIsFeatured(body.isFeatured);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid curation input.";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const market = await updateMarketCuration({
      marketId,
      seasonId,
      displayOrder,
      isFeatured,
    });

    if (!market) {
      return NextResponse.json(
        { ok: false, error: "Market not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, market });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update curation.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
