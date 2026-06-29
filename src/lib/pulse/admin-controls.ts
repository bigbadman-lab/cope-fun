import "server-only";

import {
  applyPulseEngineAdminUpdate,
  createPendingPulseRound,
  getActivePulseRound,
  getLatestPendingPulseRound,
  getLatestPulseRound,
  getPulseEngineById,
} from "@/lib/db/pulse";
import { PulseEngineNotFoundError } from "@/lib/pulse/open-round";
import {
  isAllowedPulseRoundDuration,
  type PulseRoundDurationSeconds,
} from "@/lib/pulse/duration";
import {
  resolveSolUsdPrice,
  SolUsdPriceStaleError,
  SolUsdPriceUnavailableError,
} from "@/lib/prices/resolve-sol-usd-price";
import type {
  PulseEngineRow,
  PulseHealth,
  PulseLifecycleState,
  PulseRoundRow,
} from "@/lib/pulse/types";

export type PulseAdminControlResult = {
  engine: PulseEngineRow;
  round: PulseRoundRow | null;
};

const TERMINAL_LIFECYCLE_STATES = new Set<PulseLifecycleState>([
  "archived",
  "disabled",
]);

const ACTIVE_LIFECYCLE_STATES = new Set<PulseLifecycleState>([
  "running",
  "settling",
  "pausing",
]);

export class PulseActivateNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PulseActivateNotAllowedError";
  }
}

export class PulsePauseNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PulsePauseNotAllowedError";
  }
}

export class PulseResumeNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PulseResumeNotAllowedError";
  }
}

export class PulseDisableNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PulseDisableNotAllowedError";
  }
}

async function loadContextRound(
  engine: PulseEngineRow,
): Promise<PulseRoundRow | null> {
  if (engine.activeRoundId) {
    return getActivePulseRound(engine.id);
  }

  return getLatestPulseRound(engine.id);
}

async function ensurePendingPulseRound(
  engineId: string,
): Promise<PulseRoundRow> {
  const pendingRound = await getLatestPendingPulseRound(engineId);
  if (pendingRound) {
    return pendingRound;
  }

  const latestRound = await getLatestPulseRound(engineId);
  return createPendingPulseRound({
    engineId,
    roundNumber: (latestRound?.roundNumber ?? 0) + 1,
  });
}

async function resolveActivationHealth(): Promise<PulseHealth> {
  try {
    const price = await resolveSolUsdPrice();
    if (price.source === "websocket") {
      return "healthy";
    }

    return "degraded";
  } catch (error) {
    if (error instanceof SolUsdPriceStaleError) {
      return "degraded";
    }

    return "offline";
  }
}

async function resolveResumeHealth(): Promise<PulseHealth> {
  try {
    const price = await resolveSolUsdPrice();
    if (price.source === "websocket") {
      return "healthy";
    }

    throw new PulseResumeNotAllowedError(
      "Fresh live price is required before resuming Pulse.",
    );
  } catch (error) {
    if (error instanceof PulseResumeNotAllowedError) {
      throw error;
    }

    if (error instanceof SolUsdPriceStaleError) {
      throw new PulseResumeNotAllowedError(
        "Fresh live price is required before resuming Pulse.",
      );
    }

    if (error instanceof SolUsdPriceUnavailableError) {
      throw new PulseResumeNotAllowedError(
        "Price service is unavailable. Cannot resume Pulse yet.",
      );
    }

    throw new PulseResumeNotAllowedError(
      "Price service is unavailable. Cannot resume Pulse yet.",
    );
  }
}

export async function activatePulseEngine(input: {
  engineId: string;
}): Promise<PulseAdminControlResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (TERMINAL_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    throw new PulseActivateNotAllowedError(
      `Pulse engine cannot be activated while ${engine.lifecycleState}.`,
    );
  }

  if (ACTIVE_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    throw new PulseActivateNotAllowedError(
      `Pulse engine cannot be activated while ${engine.lifecycleState}.`,
    );
  }

  if (engine.lifecycleState === "paused") {
    throw new PulseActivateNotAllowedError(
      "Paused Pulse engines must be resumed, not activated.",
    );
  }

  const health = await resolveActivationHealth();
  const round = await ensurePendingPulseRound(engineId);

  const updatedEngine = await applyPulseEngineAdminUpdate({
    engineId,
    lifecycleState: "ready",
    health,
    pauseAfterCurrent: false,
  });

  return {
    engine: updatedEngine,
    round,
  };
}

export async function pausePulseEngine(input: {
  engineId: string;
}): Promise<PulseAdminControlResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (TERMINAL_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    throw new PulsePauseNotAllowedError(
      `Pulse engine cannot be paused while ${engine.lifecycleState}.`,
    );
  }

  if (engine.lifecycleState === "paused" || engine.lifecycleState === "pausing") {
    const round = await loadContextRound(engine);
    return { engine, round };
  }

  if (engine.lifecycleState === "running") {
    const activeRound = engine.activeRoundId
      ? await getActivePulseRound(engineId)
      : null;

    if (activeRound?.status === "open") {
      const updatedEngine = await applyPulseEngineAdminUpdate({
        engineId,
        lifecycleState: "pausing",
        pauseAfterCurrent: true,
      });

      return {
        engine: updatedEngine,
        round: activeRound,
      };
    }
  }

  if (
    engine.lifecycleState === "draft" ||
    engine.lifecycleState === "ready" ||
    engine.lifecycleState === "settling"
  ) {
    const updatedEngine = await applyPulseEngineAdminUpdate({
      engineId,
      lifecycleState: "paused",
      pauseAfterCurrent: true,
      clearActiveRoundId: engine.lifecycleState !== "settling",
    });

    return {
      engine: updatedEngine,
      round: await loadContextRound(updatedEngine),
    };
  }

  throw new PulsePauseNotAllowedError(
    `Pulse engine cannot be paused while ${engine.lifecycleState}.`,
  );
}

export async function resumePulseEngine(input: {
  engineId: string;
}): Promise<PulseAdminControlResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (engine.lifecycleState !== "paused") {
    throw new PulseResumeNotAllowedError(
      `Pulse engine cannot be resumed while ${engine.lifecycleState}.`,
    );
  }

  const health = await resolveResumeHealth();
  const round = await ensurePendingPulseRound(engineId);

  const updatedEngine = await applyPulseEngineAdminUpdate({
    engineId,
    lifecycleState: "ready",
    health,
    pauseAfterCurrent: false,
  });

  return {
    engine: updatedEngine,
    round,
  };
}

export async function disablePulseEngine(input: {
  engineId: string;
}): Promise<PulseAdminControlResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  if (engine.lifecycleState === "archived") {
    throw new PulseDisableNotAllowedError(
      "Archived Pulse engines cannot be disabled.",
    );
  }

  if (engine.lifecycleState === "disabled") {
    const round = await loadContextRound(engine);
    return { engine, round };
  }

  if (
    engine.lifecycleState === "running" ||
    engine.lifecycleState === "pausing" ||
    engine.lifecycleState === "settling"
  ) {
    throw new PulseDisableNotAllowedError(
      "Pause and finish the active round before disabling Pulse.",
    );
  }

  const updatedEngine = await applyPulseEngineAdminUpdate({
    engineId,
    lifecycleState: "disabled",
    health: "offline",
    pauseAfterCurrent: false,
    clearActiveRoundId: true,
  });

  return {
    engine: updatedEngine,
    round: await loadContextRound(updatedEngine),
  };
}

export class PulseInvalidRoundDurationError extends Error {
  constructor() {
    super("Round duration must be 15, 30, 60, 300, or 900 seconds.");
    this.name = "PulseInvalidRoundDurationError";
  }
}

/** Updates round_duration_seconds for future opens only; does not change open round closes_at. */
export async function updatePulseEngineRoundDuration(input: {
  engineId: string;
  roundDurationSeconds: number;
}): Promise<PulseAdminControlResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  if (!isAllowedPulseRoundDuration(input.roundDurationSeconds)) {
    throw new PulseInvalidRoundDurationError();
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  const updatedEngine = await applyPulseEngineAdminUpdate({
    engineId,
    roundDurationSeconds: input.roundDurationSeconds as PulseRoundDurationSeconds,
  });

  return {
    engine: updatedEngine,
    round: await loadContextRound(updatedEngine),
  };
}
