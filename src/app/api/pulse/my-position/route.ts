import { NextResponse } from "next/server";
import {
  getOptionalAppUser,
} from "@/lib/auth/require-app-user";
import { getPulsePositionsForUserInRound } from "@/lib/db/pulse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function noStoreJson<T>(body: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init?.headers,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get("roundId")?.trim() ?? "";

  if (!roundId) {
    return noStoreJson(
      { ok: false, error: "roundId is required." },
      { status: 400 },
    );
  }

  if (!isUuid(roundId)) {
    return noStoreJson(
      { ok: false, error: "roundId must be a valid UUID." },
      { status: 400 },
    );
  }

  try {
    const appUser = await getOptionalAppUser(request);

    if (!appUser) {
      return noStoreJson({ ok: true, authenticated: false, positions: [] });
    }

    const positions = await getPulsePositionsForUserInRound(
      appUser.id,
      roundId,
    );

    return noStoreJson({
      ok: true,
      authenticated: true,
      positions: positions.map((position) => ({
        id: position.id,
        roundId: position.roundId,
        side: position.side,
        stakeAmount: position.stakeAmount,
        payoutCredits: position.payoutCredits,
        isWinner: position.isWinner,
        settledAt: position.settledAt,
        createdAt: position.createdAt,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load Pulse position.";

    console.error("[api/pulse/my-position]", message);

    return noStoreJson(
      { ok: false, error: "Could not load Pulse position." },
      { status: 500 },
    );
  }
}
