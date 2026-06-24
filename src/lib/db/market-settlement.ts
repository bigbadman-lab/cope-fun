import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AdminMarketRow, MarketSide } from "@/lib/markets/types";
import { getMarketById, type MarketRow } from "./markets";

async function loadAdminMarketRow(market: MarketRow): Promise<AdminMarketRow> {
  const supabase = createSupabaseServiceClient();
  const { data: room, error } = await supabase
    .from("belief_rooms")
    .select("id, slug, belief")
    .eq("id", market.room_id)
    .single();

  if (error || !room) {
    throw new Error("Could not load market room.");
  }

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

export async function settleMarketResolution(input: {
  marketId: string;
  outcome: MarketSide;
  resolutionNotes?: string | null;
}): Promise<AdminMarketRow | null> {
  const market = await getMarketById(input.marketId);
  if (!market) return null;

  if (market.status === "resolved") {
    return loadAdminMarketRow(market);
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc("resolve_market", {
    p_market_id: input.marketId,
    p_outcome: input.outcome,
    p_notes: input.resolutionNotes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Could not resolve market.");
  }

  const updated = await getMarketById(input.marketId);
  return updated ? loadAdminMarketRow(updated) : null;
}

export async function settleMarketVoid(input: {
  marketId: string;
  resolutionNotes?: string | null;
}): Promise<AdminMarketRow | null> {
  const market = await getMarketById(input.marketId);
  if (!market) return null;

  if (market.status === "voided") {
    return loadAdminMarketRow(market);
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc("void_market", {
    p_market_id: input.marketId,
    p_notes: input.resolutionNotes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Could not void market.");
  }

  const updated = await getMarketById(input.marketId);
  return updated ? loadAdminMarketRow(updated) : null;
}
