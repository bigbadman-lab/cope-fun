import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AdminMarketRow } from "@/lib/markets/types";
import { getMarketById } from "./markets";

export type CreateMarketInput = {
  roomId: string;
  title: string;
  resolutionCriteria: string;
  resolutionSource?: string | null;
  closesAt: string;
  resolvesAt?: string | null;
};

export async function createDraftMarket(
  input: CreateMarketInput,
): Promise<AdminMarketRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data: room, error: roomError } = await supabase
    .from("belief_rooms")
    .select("id, slug, belief, is_market_candidate")
    .eq("id", input.roomId)
    .eq("status", "published")
    .maybeSingle();

  if (roomError || !room) return null;
  if (!room.is_market_candidate) {
    throw new Error("Room is not a market candidate.");
  }

  const { data: existingMarket } = await supabase
    .from("belief_room_markets")
    .select("id")
    .eq("room_id", input.roomId)
    .maybeSingle();

  if (existingMarket) {
    throw new Error("This room already has a market.");
  }

  const title = input.title.trim();
  const resolutionCriteria = input.resolutionCriteria.trim();
  if (!title || !resolutionCriteria) {
    throw new Error("Title and resolution criteria are required.");
  }

  const closesAt = new Date(input.closesAt);
  if (Number.isNaN(closesAt.getTime())) {
    throw new Error("Invalid close time.");
  }

  const { data: market, error: createError } = await supabase
    .from("belief_room_markets")
    .insert({
      room_id: input.roomId,
      title,
      resolution_criteria: resolutionCriteria,
      resolution_source: input.resolutionSource?.trim() || null,
      closes_at: closesAt.toISOString(),
      resolves_at: input.resolvesAt
        ? new Date(input.resolvesAt).toISOString()
        : null,
      status: "draft",
    })
    .select("*")
    .single();

  if (createError || !market) {
    throw new Error("Could not create market.");
  }

  return mapAdminMarketRow(market, room);
}

export async function publishMarket(
  marketId: string,
): Promise<AdminMarketRow | null> {
  const market = await getMarketById(marketId);
  if (!market) return null;

  if (market.status === "open") {
    return loadAdminMarketRowById(marketId);
  }

  if (market.status !== "draft") {
    throw new Error("Only draft markets can be published.");
  }

  const closesAt = new Date(market.closes_at).getTime();
  if (closesAt <= Date.now()) {
    throw new Error("Close time must be in the future.");
  }

  const now = new Date().toISOString();
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("belief_room_markets")
    .update({
      status: "open",
      opens_at: now,
      updated_at: now,
    })
    .eq("id", marketId)
    .eq("status", "draft");

  if (error) {
    throw new Error("Could not publish market.");
  }

  return loadAdminMarketRowById(marketId);
}

export async function closeMarket(
  marketId: string,
): Promise<AdminMarketRow | null> {
  const market = await getMarketById(marketId);
  if (!market) return null;

  if (market.status === "closed") {
    return loadAdminMarketRowById(marketId);
  }

  if (market.status !== "open") {
    throw new Error("Only open markets can be closed.");
  }

  const now = new Date().toISOString();
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("belief_room_markets")
    .update({
      status: "closed",
      updated_at: now,
    })
    .eq("id", marketId)
    .eq("status", "open");

  if (error) {
    throw new Error("Could not close market.");
  }

  return loadAdminMarketRowById(marketId);
}

function mapAdminMarketRow(
  market: {
    id: string;
    room_id: string;
    title: string;
    resolution_criteria: string;
    resolution_source: string | null;
    status: AdminMarketRow["status"];
    opens_at: string | null;
    closes_at: string;
    resolves_at: string | null;
    outcome: AdminMarketRow["outcome"];
    resolved_at: string | null;
    resolution_notes: string | null;
    believe_pool_credits: number;
    cope_pool_credits: number;
    participant_count: number;
  },
  room: { id: string; slug: string; belief: string },
): AdminMarketRow {
  return {
    id: market.id,
    roomId: room.id,
    roomSlug: room.slug,
    roomBelief: room.belief,
    title: market.title,
    resolutionCriteria: market.resolution_criteria,
    resolutionSource: market.resolution_source,
    status: market.status,
    opensAt: market.opens_at,
    closesAt: market.closes_at,
    resolvesAt: market.resolves_at,
    outcome: market.outcome,
    resolvedAt: market.resolved_at,
    resolutionNotes: market.resolution_notes,
    believePool: market.believe_pool_credits,
    copePool: market.cope_pool_credits,
    participantCount: market.participant_count,
  };
}

async function loadAdminMarketRowById(
  marketId: string,
): Promise<AdminMarketRow | null> {
  const market = await getMarketById(marketId);
  if (!market) return null;

  const supabase = createSupabaseServiceClient();
  const { data: room, error } = await supabase
    .from("belief_rooms")
    .select("id, slug, belief")
    .eq("id", market.room_id)
    .single();

  if (error || !room) return null;
  return mapAdminMarketRow(market, room);
}
