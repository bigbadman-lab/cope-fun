import "server-only";

/**
 * Admin/bootstrap utility for attaching Pulse to a belief room.
 * This is not the live Pulse engine loop — it only ensures an engine row
 * and pending round 1 exist before future engine-open/settle work runs.
 */
import {
  createPendingPulseRound,
  createPulseEngineForBeliefRoom,
  getLatestPulseRound,
  getPulseEngineByBeliefRoomId,
} from "@/lib/db/pulse";
import type { PulseEngineRow, PulseRoundRow } from "@/lib/pulse/types";

export type BootstrapPulseForBeliefRoomInput = {
  beliefRoomId: string;
};

export type BootstrapPulseForBeliefRoomResult = {
  engine: PulseEngineRow;
  round: PulseRoundRow;
};

const DEFAULT_ENGINE_CONFIG = {
  assetSymbol: "SOL",
  quoteCurrency: "USD",
  providerAssetId: "solana",
  displayPair: "SOL/USD",
} as const;

async function ensurePulseEngine(
  beliefRoomId: string,
): Promise<PulseEngineRow> {
  const existingEngine = await getPulseEngineByBeliefRoomId(beliefRoomId);
  if (existingEngine) {
    return existingEngine;
  }

  try {
    return await createPulseEngineForBeliefRoom({
      beliefRoomId,
      ...DEFAULT_ENGINE_CONFIG,
    });
  } catch {
    const racedEngine = await getPulseEngineByBeliefRoomId(beliefRoomId);
    if (racedEngine) {
      return racedEngine;
    }

    throw new Error("Could not bootstrap Pulse engine.");
  }
}

async function ensurePendingRoundOne(
  engineId: string,
): Promise<PulseRoundRow> {
  const existingRound = await getLatestPulseRound(engineId);
  if (existingRound) {
    return existingRound;
  }

  try {
    return await createPendingPulseRound({
      engineId,
      roundNumber: 1,
    });
  } catch {
    const racedRound = await getLatestPulseRound(engineId);
    if (racedRound) {
      return racedRound;
    }

    throw new Error("Could not bootstrap Pulse round 1.");
  }
}

export async function bootstrapPulseForBeliefRoom(
  input: BootstrapPulseForBeliefRoomInput,
): Promise<BootstrapPulseForBeliefRoomResult> {
  const beliefRoomId = input.beliefRoomId.trim();
  if (!beliefRoomId) {
    throw new Error("Belief room id is required.");
  }

  const engine = await ensurePulseEngine(beliefRoomId);
  const round = await ensurePendingRoundOne(engine.id);

  return { engine, round };
}
