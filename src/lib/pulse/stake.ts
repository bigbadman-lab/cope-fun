import "server-only";

import type { AppUser } from "@/lib/auth/app-user";
import { getOrCreateCreditAccountForUser } from "@/lib/db/credits";
import {
  getActivePulseRound,
  getPulseEngineById,
  stakeOnPulseRoundForUser,
} from "@/lib/db/pulse";
import type {
  PulsePositionRow,
  PulsePositionSide,
  PulseRoundStatus,
} from "@/lib/pulse/types";

export const MIN_PULSE_STAKE_AMOUNT = 1;
export const MAX_PULSE_STAKE_AMOUNT = 1000;

export type PlacePulseStakeInput = {
  engineId: string;
  user: AppUser;
  side: PulsePositionSide;
  stakeAmount: number;
};

export type PlacePulseStakeResult = {
  position: PulsePositionRow;
  balanceCredits: number;
  round: {
    id: string;
    roundNumber: number;
    status: PulseRoundStatus;
    believePool: number;
    copePool: number;
  };
};

export class PulseStakeEngineNotFoundError extends Error {
  constructor() {
    super("Pulse engine not found.");
    this.name = "PulseStakeEngineNotFoundError";
  }
}

export class PulseStakeEngineNotRunningError extends Error {
  constructor() {
    super("Pulse engine is not running.");
    this.name = "PulseStakeEngineNotRunningError";
  }
}

export class PulseStakeNoActiveRoundError extends Error {
  constructor() {
    super("No active Pulse round to stake on.");
    this.name = "PulseStakeNoActiveRoundError";
  }
}

export class PulseStakeRoundNotOpenError extends Error {
  constructor() {
    super("Pulse round is not open for staking.");
    this.name = "PulseStakeRoundNotOpenError";
  }
}

export class PulseStakeRoundClosedError extends Error {
  constructor() {
    super("Pulse round has closed.");
    this.name = "PulseStakeRoundClosedError";
  }
}

export class PulseStakeEngineRoundMismatchError extends Error {
  constructor() {
    super("Pulse engine does not match active round.");
    this.name = "PulseStakeEngineRoundMismatchError";
  }
}

export class PulseStakeDuplicatePositionError extends Error {
  constructor() {
    super("You already have a position on this side for this round.");
    this.name = "PulseStakeDuplicatePositionError";
  }
}

export class PulseStakeInsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient credits.");
    this.name = "PulseStakeInsufficientCreditsError";
  }
}

export class PulseStakeInvalidUserError extends Error {
  constructor() {
    super("Signed-in user is required to place a Pulse stake.");
    this.name = "PulseStakeInvalidUserError";
  }
}

export function isAllowedPulseStakeAmount(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_PULSE_STAKE_AMOUNT &&
    value <= MAX_PULSE_STAKE_AMOUNT
  );
}

export function isPulseStakeSide(value: string): value is PulsePositionSide {
  return value === "believe" || value === "cope";
}

function mapStakeError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  switch (error.message) {
    case "You already have a position on this side for this round.":
      throw new PulseStakeDuplicatePositionError();
    case "Insufficient credits.":
      throw new PulseStakeInsufficientCreditsError();
    case "User id is required.":
    case "Credit account not found.":
      throw new PulseStakeInvalidUserError();
    case "Pulse round is not open for staking.":
      throw new PulseStakeRoundNotOpenError();
    case "Pulse round has closed.":
      throw new PulseStakeRoundClosedError();
    case "Pulse engine does not match round.":
      throw new PulseStakeEngineRoundMismatchError();
    default:
      throw error;
  }
}

export async function placePulseStakeForUser(
  input: PlacePulseStakeInput,
): Promise<PlacePulseStakeResult> {
  if (!input.user.id?.trim()) {
    throw new PulseStakeInvalidUserError();
  }

  const engine = await getPulseEngineById(input.engineId);
  if (!engine) {
    throw new PulseStakeEngineNotFoundError();
  }

  if (engine.lifecycleState !== "running") {
    throw new PulseStakeEngineNotRunningError();
  }

  if (!engine.activeRoundId) {
    throw new PulseStakeNoActiveRoundError();
  }

  const activeRound = await getActivePulseRound(engine.id);
  if (!activeRound) {
    throw new PulseStakeNoActiveRoundError();
  }

  if (activeRound.engineId !== engine.id) {
    throw new PulseStakeEngineRoundMismatchError();
  }

  if (activeRound.status !== "open") {
    throw new PulseStakeRoundNotOpenError();
  }

  if (activeRound.closesAt) {
    const closesAt = Date.parse(activeRound.closesAt);
    if (Number.isFinite(closesAt) && Date.now() >= closesAt) {
      throw new PulseStakeRoundClosedError();
    }
  }

  await getOrCreateCreditAccountForUser(input.user.id);

  try {
    const result = await stakeOnPulseRoundForUser({
      roundId: activeRound.id,
      engineId: engine.id,
      userId: input.user.id,
      walletAddress: input.user.walletAddress,
      side: input.side,
      stakeAmount: input.stakeAmount,
    });

    return {
      position: result.position,
      balanceCredits: result.balanceCredits,
      round: result.round,
    };
  } catch (error) {
    mapStakeError(error);
  }
}
