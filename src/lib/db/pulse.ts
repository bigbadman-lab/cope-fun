import "server-only";

import type {
  CreatePulsePositionInput,
  PulseEngineRow,
  PulseHealth,
  PulseLifecycleState,
  PulsePositionPools,
  PulsePositionRow,
  PulsePositionSide,
  PulseRoundRow,
  PulseRoundSettlementSummary,
  PulseRoundStatus,
  PulseWinningSide,
} from "@/lib/pulse/types";
import { PULSE_CYCLE_SEED_CREDITS } from "@/lib/pulse/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type PulseEngineDbRow = {
  id: string;
  belief_room_id: string;
  asset_symbol: string;
  quote_currency: string;
  provider_asset_id: string;
  display_pair: string;
  lifecycle_state: PulseLifecycleState;
  health: PulseHealth;
  pause_after_current: boolean;
  round_duration_seconds: number;
  active_round_id: string | null;
  created_at: string;
  updated_at: string;
};

type PulseRoundDbRow = {
  id: string;
  engine_id: string;
  round_number: number;
  status: PulseRoundStatus;
  opened_at: string | null;
  closes_at: string | null;
  settled_at: string | null;
  opening_price: string | number | null;
  opening_price_source: string | null;
  opening_price_at: string | null;
  closing_price: string | number | null;
  closing_price_source: string | null;
  closing_price_at: string | null;
  winning_side: PulseWinningSide | null;
  believe_pool: number;
  cope_pool: number;
  seed_credits: number;
  created_at: string;
  updated_at: string;
};

type PulsePositionDbRow = {
  id: string;
  round_id: string;
  engine_id: string;
  user_id: string | null;
  wallet_address: string | null;
  side: PulsePositionSide;
  stake_amount: number;
  payout_credits: number | null;
  is_winner: boolean | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

type SettlePulseRoundRpcResult = {
  winning_side: PulseWinningSide;
  total_pool: number;
  winning_pool: number;
  losing_pool: number;
  positions_settled: number;
  credits_paid: number;
  already_settled: boolean;
};

export type CreatePulseEngineInput = {
  beliefRoomId: string;
  assetSymbol?: string;
  quoteCurrency?: string;
  providerAssetId?: string;
  displayPair?: string;
};

export type CreatePendingPulseRoundInput = {
  engineId: string;
  roundNumber: number;
};

export type OpenPendingPulseRoundInput = {
  engineId: string;
  roundId: string;
  openedAt: string;
  closesAt: string;
  openingPrice: number;
  openingPriceSource: string;
  openingPriceAt: string;
  health: PulseHealth;
};

export type LockOpenPulseRoundInput = {
  engineId: string;
  roundId: string;
  closingPrice: number;
  closingPriceSource: string;
  closingPriceAt: string;
  winningSide: PulseWinningSide;
  health: PulseHealth;
};

export type FinalizeLockedPulseRoundInput = {
  engineId: string;
  roundId: string;
  nextRoundNumber: number;
  pauseAfterCurrent: boolean;
};

export type { CreatePulsePositionInput };

const PULSE_ENGINE_SELECT = `
  id,
  belief_room_id,
  asset_symbol,
  quote_currency,
  provider_asset_id,
  display_pair,
  lifecycle_state,
  health,
  pause_after_current,
  round_duration_seconds,
  active_round_id,
  created_at,
  updated_at
`;

const PULSE_ROUND_SELECT = `
  id,
  engine_id,
  round_number,
  status,
  opened_at,
  closes_at,
  settled_at,
  opening_price,
  opening_price_source,
  opening_price_at,
  closing_price,
  closing_price_source,
  closing_price_at,
  winning_side,
  believe_pool,
  cope_pool,
  seed_credits,
  created_at,
  updated_at
`;

const PULSE_POSITION_SELECT = `
  id,
  round_id,
  engine_id,
  user_id,
  wallet_address,
  side,
  stake_amount,
  payout_credits,
  is_winner,
  settled_at,
  created_at,
  updated_at
`;

function toNumericString(value: string | number | null): string | null {
  if (value === null) {
    return null;
  }

  return String(value);
}

function toPulseEngineRow(row: PulseEngineDbRow): PulseEngineRow {
  return {
    id: row.id,
    beliefRoomId: row.belief_room_id,
    assetSymbol: row.asset_symbol,
    quoteCurrency: row.quote_currency,
    providerAssetId: row.provider_asset_id,
    displayPair: row.display_pair,
    lifecycleState: row.lifecycle_state,
    health: row.health,
    pauseAfterCurrent: row.pause_after_current,
    roundDurationSeconds: row.round_duration_seconds,
    activeRoundId: row.active_round_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPulseRoundRow(row: PulseRoundDbRow): PulseRoundRow {
  return {
    id: row.id,
    engineId: row.engine_id,
    roundNumber: row.round_number,
    status: row.status,
    openedAt: row.opened_at,
    closesAt: row.closes_at,
    settledAt: row.settled_at,
    openingPrice: toNumericString(row.opening_price),
    openingPriceSource: row.opening_price_source,
    openingPriceAt: row.opening_price_at,
    closingPrice: toNumericString(row.closing_price),
    closingPriceSource: row.closing_price_source,
    closingPriceAt: row.closing_price_at,
    winningSide: row.winning_side,
    believePool: row.believe_pool,
    copePool: row.cope_pool,
    seedCredits: row.seed_credits ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPulsePositionRow(row: PulsePositionDbRow): PulsePositionRow {
  return {
    id: row.id,
    roundId: row.round_id,
    engineId: row.engine_id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    side: row.side,
    stakeAmount: row.stake_amount,
    payoutCredits: row.payout_credits,
    isWinner: row.is_winner,
    settledAt: row.settled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPulseRoundSettlementSummary(
  result: SettlePulseRoundRpcResult,
): PulseRoundSettlementSummary {
  return {
    winningSide: result.winning_side,
    totalPool: result.total_pool,
    winningPool: result.winning_pool,
    losingPool: result.losing_pool,
    positionsSettled: result.positions_settled,
    creditsPaid: result.credits_paid,
  };
}

function mapPulseEngineLoadError(): never {
  throw new Error("Could not load Pulse engine.");
}

function mapPulseRoundLoadError(): never {
  throw new Error("Could not load Pulse round.");
}

function mapDuplicatePulseEngineError(error: { code?: string }): never {
  if (error.code === "23505") {
    throw new Error("This belief room already has a Pulse engine.");
  }

  throw new Error("Could not create Pulse engine.");
}

function mapDuplicatePulseRoundError(error: { code?: string }): never {
  if (error.code === "23505") {
    throw new Error("This Pulse engine already has that round number.");
  }

  throw new Error("Could not create Pulse round.");
}

/** Pulse engine worker/admin code loads a single engine by id. */
export async function getPulseEngineById(
  engineId: string,
): Promise<PulseEngineRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_engines")
    .select(PULSE_ENGINE_SELECT)
    .eq("id", engineId)
    .maybeSingle();

  if (error) {
    mapPulseEngineLoadError();
  }

  return data ? toPulseEngineRow(data as PulseEngineDbRow) : null;
}

/** In-process Pulse runner loads engines eligible for advancePulseEngine(). */
export async function getAdvanceablePulseEngines(): Promise<PulseEngineRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_engines")
    .select(PULSE_ENGINE_SELECT)
    .in("lifecycle_state", ["ready", "running", "pausing", "settling"]);

  if (error) {
    mapPulseEngineLoadError();
  }

  return (data ?? []).map((row) => toPulseEngineRow(row as PulseEngineDbRow));
}

export type ApplyPulseEngineAdminUpdateInput = {
  engineId: string;
  lifecycleState?: PulseLifecycleState;
  health?: PulseHealth;
  pauseAfterCurrent?: boolean;
  clearActiveRoundId?: boolean;
  roundDurationSeconds?: number;
};

/** Admin lifecycle controls update engine state without opening/settling rounds. */
export async function applyPulseEngineAdminUpdate(
  input: ApplyPulseEngineAdminUpdateInput,
): Promise<PulseEngineRow> {
  const engineId = input.engineId.trim();
  if (!engineId) {
    throw new Error("Engine id is required.");
  }

  const supabase = createSupabaseServiceClient();
  const update: Record<string, unknown> = {};

  if (input.lifecycleState !== undefined) {
    update.lifecycle_state = input.lifecycleState;
  }

  if (input.health !== undefined) {
    update.health = input.health;
  }

  if (input.pauseAfterCurrent !== undefined) {
    update.pause_after_current = input.pauseAfterCurrent;
  }

  if (input.clearActiveRoundId) {
    update.active_round_id = null;
  }

  if (input.roundDurationSeconds !== undefined) {
    update.round_duration_seconds = input.roundDurationSeconds;
  }

  if (Object.keys(update).length === 0) {
    const engine = await getPulseEngineById(engineId);
    if (!engine) {
      throw new Error("Pulse engine not found.");
    }

    return engine;
  }

  const { data, error } = await supabase
    .from("pulse_engines")
    .update(update)
    .eq("id", engineId)
    .select(PULSE_ENGINE_SELECT)
    .maybeSingle();

  if (error) {
    mapPulseEngineLoadError();
  }

  if (!data) {
    throw new Error("Pulse engine not found.");
  }

  return toPulseEngineRow(data as PulseEngineDbRow);
}

/** Room routes resolve whether a belief room has Pulse attached. */
export async function getPulseEngineByBeliefRoomId(
  beliefRoomId: string,
): Promise<PulseEngineRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_engines")
    .select(PULSE_ENGINE_SELECT)
    .eq("belief_room_id", beliefRoomId)
    .maybeSingle();

  if (error) {
    mapPulseEngineLoadError();
  }

  return data ? toPulseEngineRow(data as PulseEngineDbRow) : null;
}

/** Admin/bootstrap code creates one engine per belief room in draft state. */
export async function createPulseEngineForBeliefRoom(
  input: CreatePulseEngineInput,
): Promise<PulseEngineRow> {
  const beliefRoomId = input.beliefRoomId.trim();
  if (!beliefRoomId) {
    throw new Error("Belief room id is required.");
  }

  const supabase = createSupabaseServiceClient();

  const { data: room, error: roomError } = await supabase
    .from("belief_rooms")
    .select("id")
    .eq("id", beliefRoomId)
    .maybeSingle();

  if (roomError) {
    throw new Error("Could not verify belief room.");
  }

  if (!room) {
    throw new Error("Belief room not found.");
  }

  const { data: existingEngine } = await supabase
    .from("pulse_engines")
    .select("id")
    .eq("belief_room_id", beliefRoomId)
    .maybeSingle();

  if (existingEngine) {
    throw new Error("This belief room already has a Pulse engine.");
  }

  const assetSymbol = input.assetSymbol?.trim() || "SOL";
  const quoteCurrency = input.quoteCurrency?.trim() || "USD";
  const providerAssetId = input.providerAssetId?.trim() || "solana";
  const displayPair = input.displayPair?.trim() || "SOL/USD";

  const { data, error } = await supabase
    .from("pulse_engines")
    .insert({
      belief_room_id: beliefRoomId,
      asset_symbol: assetSymbol,
      quote_currency: quoteCurrency,
      provider_asset_id: providerAssetId,
      display_pair: displayPair,
      lifecycle_state: "draft",
      health: "offline",
    })
    .select(PULSE_ENGINE_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      const raced = await getPulseEngineByBeliefRoomId(beliefRoomId);
      if (raced) {
        throw new Error("This belief room already has a Pulse engine.");
      }
    }

    mapDuplicatePulseEngineError(error);
  }

  return toPulseEngineRow(data as PulseEngineDbRow);
}

/** Pulse engine follows the engine pointer to the currently active round row. */
export async function getActivePulseRound(
  engineId: string,
): Promise<PulseRoundRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data: engine, error: engineError } = await supabase
    .from("pulse_engines")
    .select("active_round_id")
    .eq("id", engineId)
    .maybeSingle();

  if (engineError) {
    mapPulseEngineLoadError();
  }

  if (!engine?.active_round_id) {
    return null;
  }

  const { data, error } = await supabase
    .from("pulse_rounds")
    .select(PULSE_ROUND_SELECT)
    .eq("id", engine.active_round_id)
    .maybeSingle();

  if (error) {
    mapPulseRoundLoadError();
  }

  return data ? toPulseRoundRow(data as PulseRoundDbRow) : null;
}

/** Pulse engine uses the latest round number when deciding the next sequence value. */
export async function getLatestPulseRound(
  engineId: string,
): Promise<PulseRoundRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_rounds")
    .select(PULSE_ROUND_SELECT)
    .eq("engine_id", engineId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    mapPulseRoundLoadError();
  }

  return data ? toPulseRoundRow(data as PulseRoundDbRow) : null;
}

/** Manual open flow loads the newest pending round for an engine. */
export async function getLatestPendingPulseRound(
  engineId: string,
): Promise<PulseRoundRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_rounds")
    .select(PULSE_ROUND_SELECT)
    .eq("engine_id", engineId)
    .eq("status", "pending")
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    mapPulseRoundLoadError();
  }

  return data ? toPulseRoundRow(data as PulseRoundDbRow) : null;
}

/** Pulse engine creates the next round row before open/settle transitions run. */
export async function createPendingPulseRound(
  input: CreatePendingPulseRoundInput,
): Promise<PulseRoundRow> {
  if (!Number.isInteger(input.roundNumber) || input.roundNumber <= 0) {
    throw new Error("Round number must be a positive integer.");
  }

  const supabase = createSupabaseServiceClient();

  const { data: engine, error: engineError } = await supabase
    .from("pulse_engines")
    .select("id")
    .eq("id", input.engineId)
    .maybeSingle();

  if (engineError) {
    mapPulseEngineLoadError();
  }

  if (!engine) {
    throw new Error("Pulse engine not found.");
  }

  const { data, error } = await supabase
    .from("pulse_rounds")
    .insert({
      engine_id: input.engineId,
      round_number: input.roundNumber,
      status: "pending",
      seed_credits: PULSE_CYCLE_SEED_CREDITS,
    })
    .select(PULSE_ROUND_SELECT)
    .single();

  if (error) {
    mapDuplicatePulseRoundError(error);
  }

  return toPulseRoundRow(data as PulseRoundDbRow);
}

/** Applies pending -> open transition for a round and updates engine pointers. */
export async function applyPendingPulseRoundOpen(
  input: OpenPendingPulseRoundInput,
): Promise<{ engine: PulseEngineRow; round: PulseRoundRow }> {
  const supabase = createSupabaseServiceClient();

  const { data: round, error: roundError } = await supabase
    .from("pulse_rounds")
    .update({
      status: "open",
      opened_at: input.openedAt,
      closes_at: input.closesAt,
      opening_price: input.openingPrice,
      opening_price_source: input.openingPriceSource,
      opening_price_at: input.openingPriceAt,
    })
    .eq("id", input.roundId)
    .eq("engine_id", input.engineId)
    .eq("status", "pending")
    .select(PULSE_ROUND_SELECT)
    .maybeSingle();

  if (roundError) {
    mapPulseRoundLoadError();
  }

  if (!round) {
    throw new Error("No pending round to open.");
  }

  const { data: engine, error: engineError } = await supabase
    .from("pulse_engines")
    .update({
      lifecycle_state: "running",
      health: input.health,
      active_round_id: input.roundId,
    })
    .eq("id", input.engineId)
    .select(PULSE_ENGINE_SELECT)
    .single();

  if (engineError || !engine) {
    throw new Error("Could not update Pulse engine after opening round.");
  }

  return {
    engine: toPulseEngineRow(engine as PulseEngineDbRow),
    round: toPulseRoundRow(round as PulseRoundDbRow),
  };
}

/** Applies open -> locked transition for a round and moves engine into settling. */
export async function applyOpenPulseRoundLock(
  input: LockOpenPulseRoundInput,
): Promise<{ engine: PulseEngineRow; round: PulseRoundRow }> {
  const supabase = createSupabaseServiceClient();

  const { data: round, error: roundError } = await supabase
    .from("pulse_rounds")
    .update({
      status: "locked",
      closing_price: input.closingPrice,
      closing_price_source: input.closingPriceSource,
      closing_price_at: input.closingPriceAt,
      winning_side: input.winningSide,
    })
    .eq("id", input.roundId)
    .eq("engine_id", input.engineId)
    .eq("status", "open")
    .select(PULSE_ROUND_SELECT)
    .maybeSingle();

  if (roundError) {
    mapPulseRoundLoadError();
  }

  if (!round) {
    throw new Error("Active Pulse round is not open.");
  }

  const { data: engine, error: engineError } = await supabase
    .from("pulse_engines")
    .update({
      lifecycle_state: "settling",
      health: input.health,
      active_round_id: input.roundId,
    })
    .eq("id", input.engineId)
    .select(PULSE_ENGINE_SELECT)
    .single();

  if (engineError || !engine) {
    throw new Error("Could not update Pulse engine after locking round.");
  }

  return {
    engine: toPulseEngineRow(engine as PulseEngineDbRow),
    round: toPulseRoundRow(round as PulseRoundDbRow),
  };
}

/** Pays out Pulse positions and marks the round settled via settle_pulse_round() RPC. */
export async function settlePulseRound(input: {
  roundId: string;
}): Promise<PulseRoundSettlementSummary> {
  const roundId = input.roundId.trim();
  if (!roundId) {
    throw new Error("Round id is required.");
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("settle_pulse_round", {
    p_round_id: roundId,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("Pulse round not found")) {
      throw new Error("Pulse round not found.");
    }
    if (message.includes("Pulse round must be locked before settlement")) {
      throw new Error("Pulse round must be locked before settlement.");
    }
    if (message.includes("Pulse round is missing a winning side")) {
      throw new Error("Pulse round is missing a winning side.");
    }

    throw new Error("Could not settle Pulse round.");
  }

  const result = data as SettlePulseRoundRpcResult | null;
  if (
    !result ||
    typeof result.winning_side !== "string" ||
    typeof result.total_pool !== "number" ||
    typeof result.winning_pool !== "number" ||
    typeof result.losing_pool !== "number" ||
    typeof result.positions_settled !== "number" ||
    typeof result.credits_paid !== "number"
  ) {
    throw new Error("Could not settle Pulse round.");
  }

  return toPulseRoundSettlementSummary(result);
}

async function getPulseRoundById(roundId: string): Promise<PulseRoundRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_rounds")
    .select(PULSE_ROUND_SELECT)
    .eq("id", roundId)
    .maybeSingle();

  if (error) {
    mapPulseRoundLoadError();
  }

  return data ? toPulseRoundRow(data as PulseRoundDbRow) : null;
}

/** Settles payouts, then creates the next pending round and resets engine pointers. */
export async function applyLockedPulseRoundFinalize(
  input: FinalizeLockedPulseRoundInput,
): Promise<{
  engine: PulseEngineRow;
  settledRound: PulseRoundRow;
  nextRound: PulseRoundRow;
  settlement: PulseRoundSettlementSummary;
}> {
  const settlement = await settlePulseRound({ roundId: input.roundId });

  const settledRound = await getPulseRoundById(input.roundId);
  if (!settledRound || settledRound.status !== "settled") {
    throw new Error("Pulse round settlement did not complete.");
  }

  const supabase = createSupabaseServiceClient();

  let nextRound: PulseRoundRow;
  try {
    nextRound = await createPendingPulseRound({
      engineId: input.engineId,
      roundNumber: input.nextRoundNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("round number")) {
      throw new Error("Next Pulse round already exists.");
    }

    throw error;
  }

  const lifecycleState = input.pauseAfterCurrent ? "paused" : "ready";

  const { data: engine, error: engineError } = await supabase
    .from("pulse_engines")
    .update({
      lifecycle_state: lifecycleState,
      active_round_id: null,
    })
    .eq("id", input.engineId)
    .select(PULSE_ENGINE_SELECT)
    .single();

  if (engineError || !engine) {
    throw new Error("Could not update Pulse engine after finalizing round.");
  }

  return {
    engine: toPulseEngineRow(engine as PulseEngineDbRow),
    settledRound,
    nextRound,
    settlement,
  };
}

function mapPulsePositionLoadError(): never {
  throw new Error("Could not load Pulse position.");
}

function normalizeWalletAddress(
  walletAddress: string | null | undefined,
): string | null {
  const normalized = walletAddress?.trim().toLowerCase();
  return normalized || null;
}

function isPulsePositionSide(value: string): value is PulsePositionSide {
  return value === "believe" || value === "cope";
}

async function getPulsePositionById(
  positionId: string,
): Promise<PulsePositionRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_positions")
    .select(PULSE_POSITION_SELECT)
    .eq("id", positionId)
    .maybeSingle();

  if (error) {
    mapPulsePositionLoadError();
  }

  return data ? toPulsePositionRow(data as PulsePositionDbRow) : null;
}

export async function getPulsePositionsForRound(
  roundId: string,
): Promise<PulsePositionRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_positions")
    .select(PULSE_POSITION_SELECT)
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });

  if (error) {
    mapPulsePositionLoadError();
  }

  return (data ?? []).map((row) =>
    toPulsePositionRow(row as PulsePositionDbRow),
  );
}

export async function getPulsePositionPoolsForRound(
  roundId: string,
): Promise<PulsePositionPools | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_rounds")
    .select("believe_pool, cope_pool")
    .eq("id", roundId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load Pulse round pools.");
  }

  if (!data) {
    return null;
  }

  return {
    believePool: data.believe_pool,
    copePool: data.cope_pool,
  };
}

export async function getPulsePositionsForUserInRound(
  userId: string,
  roundId: string,
): Promise<PulsePositionRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_positions")
    .select(PULSE_POSITION_SELECT)
    .eq("user_id", userId)
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });

  if (error) {
    mapPulsePositionLoadError();
  }

  return (data ?? []).map((row) =>
    toPulsePositionRow(row as PulsePositionDbRow),
  );
}

export async function getPulsePositionsForUser(
  userId: string,
): Promise<PulsePositionRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_positions")
    .select(PULSE_POSITION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    mapPulsePositionLoadError();
  }

  return (data ?? []).map((row) =>
    toPulsePositionRow(row as PulsePositionDbRow),
  );
}

export async function getPulsePositionsForWallet(
  walletAddress: string,
): Promise<PulsePositionRow[]> {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  if (!normalizedWalletAddress) {
    throw new Error("Wallet address is required.");
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_positions")
    .select(PULSE_POSITION_SELECT)
    .eq("wallet_address", normalizedWalletAddress)
    .order("created_at", { ascending: false });

  if (error) {
    mapPulsePositionLoadError();
  }

  return (data ?? []).map((row) =>
    toPulsePositionRow(row as PulsePositionDbRow),
  );
}

type StakeOnPulseRoundRpcResult = {
  position_id: string;
  balance_credits: number;
  round_id: string;
  round_number: number;
  round_status: PulseRoundStatus;
  believe_pool: number;
  cope_pool: number;
};

export type StakeOnPulseRoundForUserResult = {
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

function mapStakeOnPulseRoundError(error: {
  code?: string;
  message?: string;
}): never {
  if (error.code === "23505") {
    throw new Error("You already have a position on this side for this round.");
  }

  const message = error.message ?? "";
  if (message.includes("User id is required")) {
    throw new Error("User id is required.");
  }
  if (message.includes("Stake amount must be an integer between 1 and 1000")) {
    throw new Error("Stake amount must be an integer between 1 and 1000.");
  }
  if (message.includes("Invalid stake side")) {
    throw new Error("Invalid stake side.");
  }
  if (message.includes("Insufficient credits")) {
    throw new Error("Insufficient credits.");
  }
  if (message.includes("Credit account not found")) {
    throw new Error("Credit account not found.");
  }
  if (message.includes("Pulse round not found")) {
    throw new Error("Pulse round not found.");
  }
  if (message.includes("Pulse engine does not match round")) {
    throw new Error("Pulse engine does not match round.");
  }
  if (message.includes("Pulse round is not open for staking")) {
    throw new Error("Pulse round is not open for staking.");
  }
  if (message.includes("Pulse round has closed")) {
    throw new Error("Pulse round has closed.");
  }

  throw new Error("Could not place Pulse stake.");
}

/**
 * Atomically debits credits, inserts a Pulse position, updates round pools,
 * and writes a ledger entry via stake_on_pulse_round_for_user() RPC.
 */
export async function stakeOnPulseRoundForUser(
  input: CreatePulsePositionInput,
): Promise<StakeOnPulseRoundForUserResult> {
  const roundId = input.roundId.trim();
  const engineId = input.engineId.trim();
  const userId = input.userId?.trim() || null;
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  if (!roundId || !engineId) {
    throw new Error("Round id and engine id are required.");
  }

  if (!Number.isInteger(input.stakeAmount) || input.stakeAmount <= 0) {
    throw new Error("Stake amount must be greater than zero.");
  }

  if (!isPulsePositionSide(input.side)) {
    throw new Error("Invalid stake side.");
  }

  if (!userId) {
    throw new Error("User id is required.");
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("stake_on_pulse_round_for_user", {
    p_round_id: roundId,
    p_engine_id: engineId,
    p_user_id: userId,
    p_wallet_address: walletAddress,
    p_side: input.side,
    p_stake_amount: input.stakeAmount,
  });

  if (error) {
    mapStakeOnPulseRoundError(error);
  }

  const result = data as StakeOnPulseRoundRpcResult | null;
  if (
    !result ||
    typeof result.position_id !== "string" ||
    typeof result.balance_credits !== "number" ||
    typeof result.round_id !== "string" ||
    typeof result.round_number !== "number" ||
    typeof result.round_status !== "string" ||
    typeof result.believe_pool !== "number" ||
    typeof result.cope_pool !== "number"
  ) {
    throw new Error("Could not place Pulse stake.");
  }

  const position = await getPulsePositionById(result.position_id);
  if (!position) {
    throw new Error("Could not load created Pulse position.");
  }

  return {
    position,
    balanceCredits: result.balance_credits,
    round: {
      id: result.round_id,
      roundNumber: result.round_number,
      status: result.round_status,
      believePool: result.believe_pool,
      copePool: result.cope_pool,
    },
  };
}

const ACTIVE_PULSE_ROUND_STATUSES: PulseRoundStatus[] = [
  "pending",
  "open",
  "locked",
  "settling",
];

export type ActivePulsePositionRow = {
  id: string;
  roundId: string;
  engineId: string;
  side: PulsePositionSide;
  stakeAmount: number;
  createdAt: string;
  roundNumber: number;
  roundStatus: PulseRoundStatus;
  roundOpenedAt: string | null;
  roundClosesAt: string | null;
  roundOpeningPrice: number | null;
  roundWinningSide: PulseWinningSide | null;
  displayPair: string;
  beliefRoomId: string;
  roomSlug: string;
  roomBelief: string;
};

type ActivePulseRoundEmbed = {
  round_number: number;
  status: PulseRoundStatus;
  opened_at: string | null;
  closes_at: string | null;
  opening_price: string | number | null;
  winning_side: PulseWinningSide | null;
};

type ActivePulseRoomEmbed = { slug: string; belief: string };

type ActivePulseEngineEmbed = {
  display_pair: string;
  belief_room_id: string;
  room: ActivePulseRoomEmbed | ActivePulseRoomEmbed[] | null;
};

type ActivePulsePositionDbRow = {
  id: string;
  round_id: string;
  engine_id: string;
  side: string;
  stake_amount: number;
  created_at: string;
  round: ActivePulseRoundEmbed | ActivePulseRoundEmbed[] | null;
  engine: ActivePulseEngineEmbed | ActivePulseEngineEmbed[] | null;
};

function parsePulsePrice(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unwrapEmbed<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getActivePulsePositionsForUser(
  userId: string,
): Promise<ActivePulsePositionRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_positions")
    .select(
      `
      id,
      round_id,
      engine_id,
      side,
      stake_amount,
      created_at,
      round:pulse_rounds!inner (
        round_number,
        status,
        opened_at,
        closes_at,
        opening_price,
        winning_side
      ),
      engine:pulse_engines!inner (
        display_pair,
        belief_room_id,
        room:belief_rooms!inner ( slug, belief )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load active Pulse positions.");
  }

  const rows: ActivePulsePositionRow[] = [];

  for (const raw of data ?? []) {
    const row = raw as unknown as ActivePulsePositionDbRow;
    const round = unwrapEmbed(row.round);
    if (!round) continue;

    const engine = unwrapEmbed(row.engine);
    if (!engine) continue;

    const room = unwrapEmbed(engine.room);
    if (!room) continue;

    if (!isPulsePositionSide(row.side)) continue;
    if (!ACTIVE_PULSE_ROUND_STATUSES.includes(round.status)) continue;

    rows.push({
      id: row.id,
      roundId: row.round_id,
      engineId: row.engine_id,
      side: row.side,
      stakeAmount: row.stake_amount,
      createdAt: row.created_at,
      roundNumber: round.round_number,
      roundStatus: round.status,
      roundOpenedAt: round.opened_at,
      roundClosesAt: round.closes_at,
      roundOpeningPrice: parsePulsePrice(round.opening_price),
      roundWinningSide: round.winning_side,
      displayPair: engine.display_pair,
      beliefRoomId: engine.belief_room_id,
      roomSlug: room.slug,
      roomBelief: room.belief,
    });
  }

  return rows;
}
