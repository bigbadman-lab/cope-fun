import "server-only";

import {
  createPendingPulseRound,
  getActivePulseRound,
  getLatestPendingPulseRound,
  getLatestPulseRound,
  getPulseEngineById,
} from "@/lib/db/pulse";
import { finalizeLockedPulseRound } from "@/lib/pulse/finalize-round";
import { lockOpenPulseRound } from "@/lib/pulse/lock-round";
import { openPendingPulseRound, PulseEngineNotFoundError } from "@/lib/pulse/open-round";
import type {
  PulseEngineRow,
  PulseLifecycleState,
  PulseRoundRow,
  PulseRoundSettlementSummary,
} from "@/lib/pulse/types";

export type PulseAdvanceAction =
  | "opened_round"
  | "locked_round"
  | "finalized_round"
  | "noop";

export type AdvancePulseEngineInput = {
  engineId: string;
};

export type AdvancePulseEngineResult = {
  action: PulseAdvanceAction;
  reason: string;
  engine: PulseEngineRow;
  round: PulseRoundRow | null;
  settledRound?: PulseRoundRow;
  nextRound?: PulseRoundRow;
  settlement?: PulseRoundSettlementSummary;
};

const NON_ADVANCEABLE_LIFECYCLE_STATES = new Set<PulseLifecycleState>([
  "disabled",
  "archived",
  "errored",
  "paused",
]);

function isRunningLikeLifecycle(state: PulseLifecycleState): boolean {
  return state === "running" || state === "pausing";
}

async function loadContextRound(
  engine: PulseEngineRow,
): Promise<PulseRoundRow | null> {
  if (engine.activeRoundId) {
    return getActivePulseRound(engine.id);
  }

  return getLatestPulseRound(engine.id);
}

function buildNoopResult(
  engine: PulseEngineRow,
  round: PulseRoundRow | null,
  reason: string,
): AdvancePulseEngineResult {
  return {
    action: "noop",
    reason,
    engine,
    round,
  };
}

/**
 * Advances one Pulse engine by a single safe lifecycle step.
 * Not scheduled yet — intended for admin/manual orchestration only.
 */
export async function advancePulseEngine(
  input: AdvancePulseEngineInput,
): Promise<AdvancePulseEngineResult> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const engine = await getPulseEngineById(engineId);
  if (!engine) {
    throw new PulseEngineNotFoundError();
  }

  const contextRound = await loadContextRound(engine);

  if (NON_ADVANCEABLE_LIFECYCLE_STATES.has(engine.lifecycleState)) {
    return buildNoopResult(engine, contextRound, "engine_not_advanceable");
  }

  if (engine.lifecycleState === "draft") {
    return buildNoopResult(engine, contextRound, "engine_in_draft");
  }

  if (engine.lifecycleState === "ready") {
    const pendingRound = await getLatestPendingPulseRound(engineId);
    if (!pendingRound) {
      const latestRound = await getLatestPulseRound(engineId);
      await createPendingPulseRound({
        engineId,
        roundNumber: (latestRound?.roundNumber ?? 0) + 1,
      });
    }

    const opened = await openPendingPulseRound({ engineId });
    return {
      action: "opened_round",
      reason: "opened_pending_round",
      engine: opened.engine,
      round: opened.round,
    };
  }

  if (isRunningLikeLifecycle(engine.lifecycleState)) {
    if (!engine.activeRoundId) {
      return buildNoopResult(engine, contextRound, "missing_active_round");
    }

    const activeRound = await getActivePulseRound(engineId);
    if (!activeRound) {
      return buildNoopResult(engine, contextRound, "missing_active_round");
    }

    if (activeRound.status !== "open") {
      return buildNoopResult(engine, activeRound, "active_round_not_open");
    }

    if (!activeRound.closesAt) {
      return buildNoopResult(engine, activeRound, "round_missing_close_time");
    }

    const closesAtMs = Date.parse(activeRound.closesAt);
    if (!Number.isFinite(closesAtMs)) {
      return buildNoopResult(engine, activeRound, "round_missing_close_time");
    }

    if (Date.now() < closesAtMs) {
      return buildNoopResult(engine, activeRound, "round_still_open");
    }

    const locked = await lockOpenPulseRound({ engineId });
    return {
      action: "locked_round",
      reason: "locked_open_round",
      engine: locked.engine,
      round: locked.round,
    };
  }

  if (engine.lifecycleState === "settling") {
    if (!engine.activeRoundId) {
      return buildNoopResult(engine, contextRound, "missing_active_round");
    }

    const activeRound = await getActivePulseRound(engineId);
    if (!activeRound) {
      return buildNoopResult(engine, contextRound, "missing_active_round");
    }

    if (activeRound.status !== "locked") {
      return buildNoopResult(engine, activeRound, "active_round_not_locked");
    }

    const finalized = await finalizeLockedPulseRound({ engineId });
    return {
      action: "finalized_round",
      reason: engine.pauseAfterCurrent
        ? "finalized_round_engine_paused"
        : "finalized_round_engine_ready",
      engine: finalized.engine,
      round: finalized.nextRound,
      settledRound: finalized.settledRound,
      nextRound: finalized.nextRound,
      settlement: finalized.settlement,
    };
  }

  return buildNoopResult(engine, contextRound, "engine_not_advanceable");
}

export { PulseEngineNotFoundError };
