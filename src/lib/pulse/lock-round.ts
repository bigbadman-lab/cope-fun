import "server-only";

/**
 * Manual admin action to lock an open Pulse round with a closing price.
 * This is not the automated Pulse engine loop and does not settle credits.
 */
import {
  applyOpenPulseRoundLock,
  getActivePulseRound,
  getPulseEngineById,
} from "@/lib/db/pulse";
import type {
  PulseEngineRow,
  PulseHealth,
  PulseLifecycleState,
  PulseRoundRow,
  PulseWinningSide,
} from "@/lib/pulse/types";
import {
  resolveSolUsdPrice,
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
} from "@/lib/prices/resolve-sol-usd-price";
import {
  PulseEngineNotFoundError,
} from "@/lib/pulse/open-round";

export type LockOpenPulseRoundInput = {
  engineId: string;
};

export type LockOpenPulseRoundResult = {
  engine: PulseEngineRow;
  round: PulseRoundRow;
};

const BLOCKED_LIFECYCLE_STATES = new Set<PulseLifecycleState>([
  "disabled",
  "archived",
  "errored",
]);

export class PulseLockInvalidLifecycleError extends Error {
  lifecycleState: PulseLifecycleState;

  constructor(lifecycleState: PulseLifecycleState) {
    super(`Pulse engine cannot lock a round while ${lifecycleState}.`);
    this.name = "PulseLockInvalidLifecycleError";
    this.lifecycleState = lifecycleState;
  }
}

export class PulseNoActiveRoundError extends Error {
  constructor() {
    super("No active Pulse round to lock.");
    this.name = "PulseNoActiveRoundError";
  }
}

export class PulseRoundNotOpenError extends Error {
  constructor() {
    super("Active Pulse round is not open.");
    this.name = "PulseRoundNotOpenError";
  }
}

export class PulseMissingOpeningPriceError extends Error {
  constructor() {
    super("Active Pulse round is missing an opening price.");
    this.name = "PulseMissingOpeningPriceError";
  }
}

function resolveEngineHealth(source: "websocket" | "rest_fallback"): PulseHealth {
  return source === "websocket" ? "healthy" : "degraded";
}

function parseStoredPrice(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function determineWinningSide(
  openingPrice: number,
  closingPrice: number,
): PulseWinningSide {
  if (closingPrice > openingPrice) {
    return "believe";
  }

  if (closingPrice < openingPrice) {
    return "cope";
  }

  return "draw";
}

export async function lockOpenPulseRound(
  input: LockOpenPulseRoundInput,
): Promise<LockOpenPulseRoundResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (BLOCKED_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    throw new PulseLockInvalidLifecycleError(engine.lifecycleState);
  }

  if (!engine.activeRoundId) {
    throw new PulseNoActiveRoundError();
  }

  const activeRound = await getActivePulseRound(engineId);
  if (!activeRound) {
    throw new PulseNoActiveRoundError();
  }

  if (activeRound.status !== "open") {
    throw new PulseRoundNotOpenError();
  }

  const openingPrice = parseStoredPrice(activeRound.openingPrice);
  if (openingPrice === null) {
    throw new PulseMissingOpeningPriceError();
  }

  const price = await resolveSolUsdPrice();
  const winningSide = determineWinningSide(openingPrice, price.price);

  return applyOpenPulseRoundLock({
    engineId,
    roundId: activeRound.id,
    closingPrice: price.price,
    closingPriceSource: price.source,
    closingPriceAt: price.updatedAt,
    winningSide,
    health: resolveEngineHealth(price.source),
  });
}

export {
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
};
