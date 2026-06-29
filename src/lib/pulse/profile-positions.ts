import "server-only";

import { getActivePulsePositionsForUser } from "@/lib/db/pulse";
import { resolveSolUsdPrice } from "@/lib/prices/resolve-sol-usd-price";
import type { ProfilePulsePositionSummary } from "@/lib/profile/types";
import type { PulseRoundStatus, PulseWinningSide } from "@/lib/pulse/types";

const FINALIZED_ROUND_STATUSES = new Set<PulseRoundStatus>([
  "locked",
  "settling",
  "settled",
]);

function computeSecondsRemaining(closesAt: string | null): number | null {
  if (!closesAt) return null;
  const closesAtMs = Date.parse(closesAt);
  if (!Number.isFinite(closesAtMs)) return null;
  return Math.max(0, Math.floor((closesAtMs - Date.now()) / 1000));
}

function computeCurrentlyWinningSide(input: {
  roundStatus: PulseRoundStatus;
  openingPrice: number | null;
  winningSide: PulseWinningSide | null;
  livePrice: number | null;
}): PulseWinningSide | null {
  if (
    FINALIZED_ROUND_STATUSES.has(input.roundStatus) &&
    input.winningSide !== null
  ) {
    return input.winningSide;
  }

  if (input.livePrice === null || input.openingPrice === null) {
    return null;
  }

  if (input.livePrice > input.openingPrice) return "believe";
  if (input.livePrice < input.openingPrice) return "cope";
  return "draw";
}

export async function getUserActivePulsePositions(
  userId: string,
): Promise<ProfilePulsePositionSummary[]> {
  const rows = await getActivePulsePositionsForUser(userId);
  if (rows.length === 0) return [];

  let livePrice: number | null = null;
  try {
    const resolved = await resolveSolUsdPrice();
    livePrice = resolved.price;
  } catch {
    livePrice = null;
  }

  return rows.map((row) => ({
    id: row.id,
    roundId: row.roundId,
    roundNumber: row.roundNumber,
    roundStatus: row.roundStatus,
    displayPair: row.displayPair,
    roomSlug: row.roomSlug,
    roomBelief: row.roomBelief,
    side: row.side,
    stakeCredits: row.stakeAmount,
    secondsRemaining: computeSecondsRemaining(row.roundClosesAt),
    currentlyWinningSide: computeCurrentlyWinningSide({
      roundStatus: row.roundStatus,
      openingPrice: row.roundOpeningPrice,
      winningSide: row.roundWinningSide,
      livePrice,
    }),
    createdAt: row.createdAt,
  }));
}
