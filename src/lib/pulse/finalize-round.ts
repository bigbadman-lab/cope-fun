import "server-only";

/**
 * Manual admin action to finalize a locked Pulse round and queue the next pending round.
 * This is not the automated Pulse engine loop.
 */
import {
  applyLockedPulseRoundFinalize,
  getActivePulseRound,
  getPulseEngineById,
} from "@/lib/db/pulse";
import type {
  PulseEngineRow,
  PulseLifecycleState,
  PulseRoundRow,
  PulseRoundSettlementSummary,
} from "@/lib/pulse/types";
import { PulseEngineNotFoundError } from "@/lib/pulse/open-round";

export type FinalizeLockedPulseRoundInput = {
  engineId: string;
};

export type FinalizeLockedPulseRoundResult = {
  engine: PulseEngineRow;
  settledRound: PulseRoundRow;
  nextRound: PulseRoundRow;
  settlement: PulseRoundSettlementSummary;
};

const BLOCKED_LIFECYCLE_STATES = new Set<PulseLifecycleState>([
  "disabled",
  "archived",
  "errored",
]);

export class PulseFinalizeInvalidLifecycleError extends Error {
  lifecycleState: PulseLifecycleState;

  constructor(lifecycleState: PulseLifecycleState) {
    super(`Pulse engine cannot finalize a round while ${lifecycleState}.`);
    this.name = "PulseFinalizeInvalidLifecycleError";
    this.lifecycleState = lifecycleState;
  }
}

export class PulseNoActiveRoundError extends Error {
  constructor() {
    super("No active Pulse round to finalize.");
    this.name = "PulseNoActiveRoundError";
  }
}

export class PulseRoundNotLockedError extends Error {
  constructor() {
    super("Active Pulse round is not locked.");
    this.name = "PulseRoundNotLockedError";
  }
}

export class PulseMissingClosingPriceError extends Error {
  constructor() {
    super("Active Pulse round is missing a closing price.");
    this.name = "PulseMissingClosingPriceError";
  }
}

export class PulseMissingWinningSideError extends Error {
  constructor() {
    super("Active Pulse round is missing a winning side.");
    this.name = "PulseMissingWinningSideError";
  }
}

export class PulseDuplicateNextRoundError extends Error {
  constructor() {
    super("Next Pulse round already exists.");
    this.name = "PulseDuplicateNextRoundError";
  }
}

function hasStoredPrice(value: string | null): boolean {
  if (value === null) {
    return false;
  }

  return Number.isFinite(Number(value));
}

export async function finalizeLockedPulseRound(
  input: FinalizeLockedPulseRoundInput,
): Promise<FinalizeLockedPulseRoundResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (BLOCKED_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    throw new PulseFinalizeInvalidLifecycleError(engine.lifecycleState);
  }

  if (!engine.activeRoundId) {
    throw new PulseNoActiveRoundError();
  }

  const activeRound = await getActivePulseRound(engineId);
  if (!activeRound) {
    throw new PulseNoActiveRoundError();
  }

  if (activeRound.status !== "locked") {
    throw new PulseRoundNotLockedError();
  }

  if (!hasStoredPrice(activeRound.closingPrice)) {
    throw new PulseMissingClosingPriceError();
  }

  if (!activeRound.winningSide) {
    throw new PulseMissingWinningSideError();
  }

  try {
    return await applyLockedPulseRoundFinalize({
      engineId,
      roundId: activeRound.id,
      nextRoundNumber: activeRound.roundNumber + 1,
      pauseAfterCurrent: engine.pauseAfterCurrent,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Next Pulse round already exists."
    ) {
      throw new PulseDuplicateNextRoundError();
    }

    if (
      error instanceof Error &&
      (error.message === "Active Pulse round is not locked." ||
        error.message === "Pulse round must be locked before settlement.")
    ) {
      throw new PulseRoundNotLockedError();
    }

    throw error;
  }
}
