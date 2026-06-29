import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import {
  finalizeLockedPulseRound,
  PulseDuplicateNextRoundError,
  PulseFinalizeInvalidLifecycleError,
  PulseMissingClosingPriceError,
  PulseMissingWinningSideError,
  PulseNoActiveRoundError,
  PulseRoundNotLockedError,
} from "@/lib/pulse/finalize-round";
import { PulseEngineNotFoundError } from "@/lib/pulse/open-round";

type FinalizePulseRoundRequest = {
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
    const body = (await request.json()) as FinalizePulseRoundRequest;

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

    const result = await finalizeLockedPulseRound({ engineId });

    return NextResponse.json({
      ok: true,
      engine: result.engine,
      settledRound: result.settledRound,
      nextRound: result.nextRound,
      settlement: result.settlement,
    });
  } catch (error) {
    if (error instanceof PulseEngineNotFoundError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 404 },
      );
    }

    if (error instanceof PulseFinalizeInvalidLifecycleError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    if (
      error instanceof PulseNoActiveRoundError ||
      error instanceof PulseRoundNotLockedError ||
      error instanceof PulseMissingClosingPriceError ||
      error instanceof PulseMissingWinningSideError ||
      error instanceof PulseDuplicateNextRoundError
    ) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Could not finalize Pulse round.";

    console.error("[admin/pulse/finalize-round]", message);

    return NextResponse.json(
      { ok: false, error: "Could not finalize Pulse round." },
      { status: 500 },
    );
  }
}
