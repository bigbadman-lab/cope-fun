import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AdminMarketRow } from "@/lib/markets/types";
import {
  canEditMarketContent,
  isTerminalMarketStatus,
} from "@/lib/markets/admin-publish-guardrails";
import {
  getDefaultSeasonForNewMarket,
  parseDisplayOrder,
  parseIsFeatured,
  parseSeasonMarketId,
} from "@/lib/markets/season-curation";
import {
  parseTreasuryConvictionCope,
  toTreasuryConvictionCope,
} from "@/lib/markets/treasury-conviction";
import { getMarketById } from "./markets";

export type CreateMarketInput = {
  roomId: string;
  title: string;
  resolutionCriteria: string;
  resolutionSource?: string | null;
  closesAt: string;
  resolvesAt?: string | null;
  treasuryConvictionCope?: number;
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

  const treasuryConvictionCope = parseTreasuryConvictionCope(
    input.treasuryConvictionCope ?? 0,
  );

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
      treasury_conviction_cope: treasuryConvictionCope,
      season_id: getDefaultSeasonForNewMarket(),
      display_order: null,
      is_featured: false,
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

export type UpdateMarketAdminFieldsInput = {
  marketId: string;
  title?: string;
  resolutionCriteria?: string;
  resolutionSource?: string | null;
  closesAt?: string;
  resolvesAt?: string | null;
  treasuryConvictionCope?: number;
  seasonId?: string;
  displayOrder?: number | null;
  isFeatured?: boolean;
};

function mapDuplicateOrderError(error: { code?: string }): never {
  if (error.code === "23505") {
    throw new Error(
      "Display order is already used by another market in this season.",
    );
  }
  throw new Error("Could not update market.");
}

export async function updateMarketAdminFields(
  input: UpdateMarketAdminFieldsInput,
): Promise<AdminMarketRow | null> {
  const market = await getMarketById(input.marketId);
  if (!market) return null;

  const terminal = isTerminalMarketStatus(market.status);
  const contentEditable = canEditMarketContent(market.status);

  const hasContentUpdate =
    input.title !== undefined ||
    input.resolutionCriteria !== undefined ||
    input.resolutionSource !== undefined ||
    input.closesAt !== undefined ||
    input.resolvesAt !== undefined ||
    input.treasuryConvictionCope !== undefined;

  if (terminal && hasContentUpdate) {
    throw new Error(
      "Resolved or voided markets only support season, display order, and featured updates.",
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (contentEditable) {
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new Error("Title is required.");
      updates.title = title;
    }

    if (input.resolutionCriteria !== undefined) {
      const resolutionCriteria = input.resolutionCriteria.trim();
      if (!resolutionCriteria) {
        throw new Error("Resolution criteria cannot be empty.");
      }
      updates.resolution_criteria = resolutionCriteria;
    }

    if (input.resolutionSource !== undefined) {
      updates.resolution_source = input.resolutionSource?.trim() || null;
    }

    if (input.closesAt !== undefined) {
      const closesAt = new Date(input.closesAt);
      if (Number.isNaN(closesAt.getTime())) {
        throw new Error("Invalid close time.");
      }
      updates.closes_at = closesAt.toISOString();
    }

    if (input.resolvesAt !== undefined) {
      updates.resolves_at = input.resolvesAt
        ? new Date(input.resolvesAt).toISOString()
        : null;
    }

    if (input.treasuryConvictionCope !== undefined) {
      updates.treasury_conviction_cope = parseTreasuryConvictionCope(
        input.treasuryConvictionCope,
      );
    }
  }

  if (input.seasonId !== undefined) {
    updates.season_id = parseSeasonMarketId(input.seasonId);
  }

  if (input.displayOrder !== undefined) {
    updates.display_order = parseDisplayOrder(input.displayOrder);
  }

  if (input.isFeatured !== undefined) {
    updates.is_featured = parseIsFeatured(input.isFeatured);
  }

  if (Object.keys(updates).length <= 1) {
    throw new Error("No fields to update.");
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("belief_room_markets")
    .update(updates)
    .eq("id", input.marketId);

  if (error) {
    mapDuplicateOrderError(error);
  }

  return loadAdminMarketRowById(input.marketId);
}

export type UpdateMarketCurationInput = {
  marketId: string;
  seasonId: string;
  displayOrder: number | null;
  isFeatured: boolean;
};

export async function updateMarketCuration(
  input: UpdateMarketCurationInput,
): Promise<AdminMarketRow | null> {
  return updateMarketAdminFields({
    marketId: input.marketId,
    seasonId: input.seasonId,
    displayOrder: input.displayOrder,
    isFeatured: input.isFeatured,
  });
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
    treasury_conviction_cope: number | string;
    season_id: string;
    display_order: number | null;
    is_featured: boolean;
    created_at: string;
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
    treasuryConvictionCope: toTreasuryConvictionCope(
      market.treasury_conviction_cope,
    ),
    seasonId: market.season_id,
    displayOrder: market.display_order,
    isFeatured: market.is_featured,
    createdAt: market.created_at,
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
