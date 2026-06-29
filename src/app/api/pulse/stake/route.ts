import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import {
  isAllowedPulseStakeAmount,
  isPulseStakeSide,
  placePulseStakeForUser,
  PulseStakeDuplicatePositionError,
  PulseStakeEngineNotFoundError,
  PulseStakeEngineNotRunningError,
  PulseStakeEngineRoundMismatchError,
  PulseStakeInsufficientCreditsError,
  PulseStakeInvalidUserError,
  PulseStakeNoActiveRoundError,
  PulseStakeRoundClosedError,
  PulseStakeRoundNotOpenError,
} from "@/lib/pulse/stake";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PulseStakeRequest = {
  engineId?: unknown;
  side?: unknown;
  stakeAmount?: unknown;
};

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export async function POST(request: Request) {
  try {
    const appUser = await requireAppUser(request);
    const body = (await request.json()) as PulseStakeRequest;

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

    if (typeof body.side !== "string" || !isPulseStakeSide(body.side)) {
      return NextResponse.json(
        { ok: false, error: "side must be believe or cope." },
        { status: 400 },
      );
    }

    if (
      typeof body.stakeAmount !== "number" ||
      !isAllowedPulseStakeAmount(body.stakeAmount)
    ) {
      return NextResponse.json(
        { ok: false, error: "stakeAmount must be an integer between 1 and 1000." },
        { status: 400 },
      );
    }

    const result = await placePulseStakeForUser({
      engineId,
      user: appUser,
      side: body.side,
      stakeAmount: body.stakeAmount,
    });

    return NextResponse.json({
      ok: true,
      position: result.position,
      round: result.round,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse(error.message);
    }

    if (error instanceof PulseStakeEngineNotFoundError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 404 },
      );
    }

    if (error instanceof PulseStakeInvalidUserError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }

    if (
      error instanceof PulseStakeEngineNotRunningError ||
      error instanceof PulseStakeNoActiveRoundError ||
      error instanceof PulseStakeRoundNotOpenError ||
      error instanceof PulseStakeRoundClosedError ||
      error instanceof PulseStakeEngineRoundMismatchError ||
      error instanceof PulseStakeDuplicatePositionError ||
      error instanceof PulseStakeInsufficientCreditsError
    ) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Could not place Pulse stake.";

    console.error("[api/pulse/stake]", message);

    return NextResponse.json(
      { ok: false, error: "Could not place Pulse stake." },
      { status: 500 },
    );
  }
}
