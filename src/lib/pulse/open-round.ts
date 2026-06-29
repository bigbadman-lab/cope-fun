import "server-only";

/**
 * Manual admin action to open an existing pending Pulse round.
 * This is not the automated Pulse engine loop.
 */
import {
  applyPendingPulseRoundOpen,
  getActivePulseRound,
  getLatestPendingPulseRound,
  getPulseEngineById,
} from "@/lib/db/pulse";
import type { PulseEngineRow, PulseHealth, PulseLifecycleState, PulseRoundRow } from "@/lib/pulse/types";
import {
  resolveSolUsdPrice,
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
} from "@/lib/prices/resolve-sol-usd-price";

export type OpenPendingPulseRoundInput = {
  engineId: string;
};

export type OpenPendingPulseRoundResult = {
  engine: PulseEngineRow;
  round: PulseRoundRow;
};

const BLOCKED_LIFECYCLE_STATES = new Set<PulseLifecycleState>([
  "disabled",
  "archived",
  "errored",
]);

export class PulseEngineNotFoundError extends Error {
  constructor() {
    super("Pulse engine not found.");
    this.name = "PulseEngineNotFoundError";
  }
}

export class PulseInvalidLifecycleError extends Error {
  lifecycleState: PulseLifecycleState;

  constructor(lifecycleState: PulseLifecycleState) {
    super(`Pulse engine cannot open a round while ${lifecycleState}.`);
    this.name = "PulseInvalidLifecycleError";
    this.lifecycleState = lifecycleState;
  }
}

export class PulseOpenRoundStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PulseOpenRoundStateError";
  }
}

export class PulseNoPendingRoundError extends Error {
  constructor() {
    super("No pending round to open.");
    this.name = "PulseNoPendingRoundError";
  }
}

function resolveEngineHealth(source: "websocket" | "rest_fallback"): PulseHealth {
  return source === "websocket" ? "healthy" : "degraded";
}

export async function openPendingPulseRound(
  input: OpenPendingPulseRoundInput,
): Promise<OpenPendingPulseRoundResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (BLOCKED_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    throw new PulseInvalidLifecycleError(engine.lifecycleState);
  }

  if (engine.activeRoundId) {
    const activeRound = await getActivePulseRound(engineId);
    if (activeRound?.status === "open") {
      throw new PulseOpenRoundStateError("Pulse engine already has an open round.");
    }
  }

  const pendingRound = await getLatestPendingPulseRound(engineId);
  if (!pendingRound) {
    throw new PulseNoPendingRoundError();
  }

  const price = await resolveSolUsdPrice();
  const openedAt = new Date();
  const closesAt = new Date(
    openedAt.getTime() + engine.roundDurationSeconds * 1000,
  );

  const result = await applyPendingPulseRoundOpen({
    engineId,
    roundId: pendingRound.id,
    openedAt: openedAt.toISOString(),
    closesAt: closesAt.toISOString(),
    openingPrice: price.price,
    openingPriceSource: price.source,
    openingPriceAt: price.updatedAt,
    health: resolveEngineHealth(price.source),
  });

  return result;
}

export {
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
};
