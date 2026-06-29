import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import {
  openPendingPulseRound,
  PulseEngineNotFoundError,
  PulseInvalidLifecycleError,
  PulseNoPendingRoundError,
  PulseOpenRoundStateError,
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
} from "@/lib/pulse/open-round";

type OpenPulseRoundRequest = {
  engineId?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as OpenPulseRoundRequest;

    if (typeof body.engineId !== "string" || !body.engineId.trim()) {
      return NextResponse.json(
        { ok: false, error: "engineId is required." },
        { status: 400 },
      );
    }

    const engineId = body.engineId.trim();
    if (!isUuid(engineId)) {
      return NextResponse.json(
        { ok: false, error: "engineId must be a valid UUID." },
        { status: 400 },
      );
    }

    const result = await openPendingPulseRound({ engineId });

    return NextResponse.json({
      ok: true,
      engine: result.engine,
      round: result.round,
    });
  } catch (error) {
    if (error instanceof PulseEngineNotFoundError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 404 },
      );
    }

    if (error instanceof PulseInvalidLifecycleError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    if (error instanceof PulseOpenRoundStateError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    if (error instanceof PulseNoPendingRoundError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    if (error instanceof SolUsdPriceUnavailableError) {
      return NextResponse.json(
        {
          ok: false,
          error: "price_unavailable",
          message: error.message,
          connectionStatus: error.connectionStatus,
        },
        { status: 503 },
      );
    }

    if (error instanceof SolUsdPriceStaleError) {
      return NextResponse.json(
        {
          ok: false,
          error: "price_stale",
          message: error.message,
          lastPrice: error.lastPrice,
          updatedAt: error.updatedAt,
          connectionStatus: error.connectionStatus,
          priceAgeMs: error.priceAgeMs,
        },
        { status: 503 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Could not open Pulse round.";

    console.error("[admin/pulse/open-round]", message);

    return NextResponse.json(
      { ok: false, error: "Could not open Pulse round." },
      { status: 500 },
    );
  }
}
