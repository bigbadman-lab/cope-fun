import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getMarketDisplayStatus } from "@/lib/markets/display-status";
import {
  analyzeSeasonLaunch,
  comparePublicMarketCuration,
  getCurrentSeasonMarketId,
  type SeasonCurationMarketInput,
} from "@/lib/markets/season-curation";
import { toTreasuryConvictionCope } from "@/lib/markets/treasury-conviction";
import type {
  AdminMarketCandidate,
  AdminMarketRow,
  AdminMarketsData,
  MarketPositionView,
  MarketSide,
  MarketStatus,
  PublicMarket,
  PublicMarketStatus,
  RoomMarketView,
} from "@/lib/markets/types";

type MarketRow = {
  id: string;
  room_id: string;
  title: string;
  resolution_criteria: string;
  resolution_source: string | null;
  status: MarketStatus;
  opens_at: string | null;
  closes_at: string;
  resolves_at: string | null;
  outcome: MarketSide | null;
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
};

type RoomJoin = {
  id: string;
  slug: string;
  belief: string;
  is_hidden: boolean;
};

type PositionRow = {
  id: string;
  side: MarketSide;
  stake_credits: number;
  payout_credits: number | null;
  is_winner: boolean | null;
  settled_at: string | null;
};

function toPositionView(row: PositionRow): MarketPositionView {
  return {
    id: row.id,
    side: row.side,
    stakeCredits: row.stake_credits,
    payoutCredits: row.payout_credits,
    isWinner: row.is_winner,
    settledAt: row.settled_at,
  };
}

function toPublicMarket(
  market: MarketRow,
  room: RoomJoin,
): PublicMarket | AdminMarketRow {
  const base = {
    id: market.id,
    roomId: room.id,
    roomSlug: room.slug,
    roomBelief: room.belief,
    title: market.title,
    resolutionCriteria: market.resolution_criteria,
    resolutionSource: market.resolution_source,
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

  return {
    ...base,
    status: market.status as PublicMarketStatus | MarketStatus,
  } as PublicMarket | AdminMarketRow;
}

async function loadMarketsWithRooms(
  statusFilter?: MarketStatus[],
  includeHidden = false,
): Promise<Array<{ market: MarketRow; room: RoomJoin }>> {
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("belief_room_markets")
    .select(
      `
      id,
      room_id,
      title,
      resolution_criteria,
      resolution_source,
      status,
      opens_at,
      closes_at,
      resolves_at,
      outcome,
      resolved_at,
      resolution_notes,
      believe_pool_credits,
      cope_pool_credits,
      participant_count,
      treasury_conviction_cope,
      season_id,
      display_order,
      is_featured,
      created_at,
      belief_rooms!inner (
        id,
        slug,
        belief,
        is_hidden
      )
    `,
    )
    .order("closes_at", { ascending: false });

  if (statusFilter?.length) {
    query = query.in("status", statusFilter);
  }

  if (!includeHidden) {
    query = query.eq("belief_rooms.is_hidden", false);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new Error("Could not load markets.");
  }

  return data.map((row) => {
    const roomRaw = row.belief_rooms as unknown as RoomJoin | RoomJoin[];
    const room = Array.isArray(roomRaw) ? roomRaw[0] : roomRaw;
    const market = {
      id: row.id,
      room_id: row.room_id,
      title: row.title,
      resolution_criteria: row.resolution_criteria,
      resolution_source: row.resolution_source,
      status: row.status,
      opens_at: row.opens_at,
      closes_at: row.closes_at,
      resolves_at: row.resolves_at,
      outcome: row.outcome,
      resolved_at: row.resolved_at,
      resolution_notes: row.resolution_notes,
      believe_pool_credits: row.believe_pool_credits,
      cope_pool_credits: row.cope_pool_credits,
      participant_count: row.participant_count,
      treasury_conviction_cope: row.treasury_conviction_cope,
      season_id: row.season_id,
      display_order: row.display_order,
      is_featured: row.is_featured,
      created_at: row.created_at,
    } satisfies MarketRow;
    return { market, room };
  });
}

export async function getPublicMarkets(): Promise<{
  open: PublicMarket[];
  closed: PublicMarket[];
  resolved: PublicMarket[];
  voided: PublicMarket[];
}> {
  const rows = await loadMarketsWithRooms(undefined, false);
  const open: PublicMarket[] = [];
  const closed: PublicMarket[] = [];
  const resolved: PublicMarket[] = [];
  const voided: PublicMarket[] = [];

  for (const { market, room } of rows) {
    if (market.status === "draft") continue;
    const mapped = toPublicMarket(market, room) as PublicMarket;

    if (market.status === "open") {
      const displayStatus = getMarketDisplayStatus(
        market.status,
        market.closes_at,
      );
      if (displayStatus === "awaiting_resolution") {
        closed.push(mapped);
      } else {
        open.push(mapped);
      }
    } else if (market.status === "closed") closed.push(mapped);
    else if (market.status === "resolved") resolved.push(mapped);
    else if (market.status === "voided") voided.push(mapped);
  }

  const currentSeasonId = getCurrentSeasonMarketId();
  const sortBucket = (markets: PublicMarket[]) =>
    [...markets].sort((a, b) =>
      comparePublicMarketCuration(a, b, currentSeasonId),
    );

  return {
    open: sortBucket(open),
    closed: sortBucket(closed),
    resolved: sortBucket(resolved),
    voided: sortBucket(voided),
  };
}

export async function getRoomMarketBySlug(
  slug: string,
  viewer?: { userId?: string | null; anonymousSessionId?: string | null },
): Promise<RoomMarketView | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_markets")
    .select(
      `
      id,
      room_id,
      title,
      resolution_criteria,
      resolution_source,
      status,
      opens_at,
      closes_at,
      resolves_at,
      outcome,
      resolved_at,
      resolution_notes,
      believe_pool_credits,
      cope_pool_credits,
      participant_count,
      treasury_conviction_cope,
      season_id,
      display_order,
      is_featured,
      created_at,
      belief_rooms!inner (
        id,
        slug,
        belief,
        is_hidden
      )
    `,
    )
    .eq("belief_rooms.slug", slug)
    .neq("status", "draft")
    .maybeSingle();

  if (error || !data) return null;

  const roomRaw = data.belief_rooms as unknown as RoomJoin | RoomJoin[];
  const room = Array.isArray(roomRaw) ? roomRaw[0] : roomRaw;
  const market: MarketRow = {
    id: data.id,
    room_id: data.room_id,
    title: data.title,
    resolution_criteria: data.resolution_criteria,
    resolution_source: data.resolution_source,
    status: data.status,
    opens_at: data.opens_at,
    closes_at: data.closes_at,
    resolves_at: data.resolves_at,
    outcome: data.outcome,
    resolved_at: data.resolved_at,
    resolution_notes: data.resolution_notes,
    believe_pool_credits: data.believe_pool_credits,
    cope_pool_credits: data.cope_pool_credits,
    participant_count: data.participant_count,
    treasury_conviction_cope: data.treasury_conviction_cope,
    season_id: data.season_id,
    display_order: data.display_order,
    is_featured: data.is_featured,
    created_at: data.created_at,
  };
  const base = toPublicMarket(market, room) as PublicMarket;

  let userPosition: MarketPositionView | null = null;
  if (viewer?.userId) {
    const { data: position } = await supabase
      .from("belief_market_positions")
      .select(
        "id, side, stake_credits, payout_credits, is_winner, settled_at",
      )
      .eq("market_id", market.id)
      .eq("user_id", viewer.userId)
      .maybeSingle();

    if (position) {
      userPosition = toPositionView(position as PositionRow);
    }
  } else if (viewer?.anonymousSessionId) {
    const { data: position } = await supabase
      .from("belief_market_positions")
      .select(
        "id, side, stake_credits, payout_credits, is_winner, settled_at",
      )
      .eq("market_id", market.id)
      .eq("anonymous_session_id", viewer.anonymousSessionId)
      .maybeSingle();

    if (position) {
      userPosition = toPositionView(position as PositionRow);
    }
  }

  return {
    ...base,
    userPosition,
    userAccount: null,
  };
}

export async function getMarketById(marketId: string): Promise<MarketRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_markets")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();

  if (error || !data) return null;
  return data as MarketRow;
}

export async function getAdminMarketsData(): Promise<AdminMarketsData> {
  const supabase = createSupabaseServiceClient();

  const { data: allMarkets, error: marketsError } = await supabase
    .from("belief_room_markets")
    .select(
      `
      id,
      room_id,
      title,
      resolution_criteria,
      resolution_source,
      status,
      opens_at,
      closes_at,
      resolves_at,
      outcome,
      resolved_at,
      resolution_notes,
      believe_pool_credits,
      cope_pool_credits,
      participant_count,
      treasury_conviction_cope,
      season_id,
      display_order,
      is_featured,
      created_at,
      belief_rooms!inner (
        id,
        slug,
        belief,
        is_hidden
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (marketsError || !allMarkets) {
    throw new Error("Could not load admin markets.");
  }

  const marketRoomIds = new Set(
    allMarkets.map((row) => {
      const roomRaw = row.belief_rooms as unknown as RoomJoin | RoomJoin[];
      const room = Array.isArray(roomRaw) ? roomRaw[0] : roomRaw;
      return room.id;
    }),
  );

  const { data: candidateRooms, error: candidatesError } = await supabase
    .from("belief_rooms")
    .select("id, slug, belief, created_at, challenge_count")
    .eq("status", "published")
    .eq("is_market_candidate", true)
    .order("created_at", { ascending: false });

  if (candidatesError || !candidateRooms) {
    throw new Error("Could not load market candidates.");
  }

  const candidates: AdminMarketCandidate[] = candidateRooms
    .filter((room) => !marketRoomIds.has(room.id))
    .map((room) => ({
      roomId: room.id,
      slug: room.slug,
      belief: room.belief,
      createdAt: room.created_at,
      challengeCount: room.challenge_count,
    }));

  const drafts: AdminMarketRow[] = [];
  const open: AdminMarketRow[] = [];
  const closed: AdminMarketRow[] = [];
  const terminal: AdminMarketRow[] = [];

  const curationInputs: SeasonCurationMarketInput[] = [];

  for (const row of allMarkets) {
    const roomRaw = row.belief_rooms as unknown as RoomJoin | RoomJoin[];
    const room = Array.isArray(roomRaw) ? roomRaw[0] : roomRaw;
    const marketRow: MarketRow = {
      id: row.id,
      room_id: row.room_id,
      title: row.title,
      resolution_criteria: row.resolution_criteria,
      resolution_source: row.resolution_source,
      status: row.status,
      opens_at: row.opens_at,
      closes_at: row.closes_at,
      resolves_at: row.resolves_at,
      outcome: row.outcome,
      resolved_at: row.resolved_at,
      resolution_notes: row.resolution_notes,
      believe_pool_credits: row.believe_pool_credits,
      cope_pool_credits: row.cope_pool_credits,
      participant_count: row.participant_count,
      treasury_conviction_cope: row.treasury_conviction_cope,
      season_id: row.season_id,
      display_order: row.display_order,
      is_featured: row.is_featured,
      created_at: row.created_at,
    };
    const mapped = toPublicMarket(marketRow, room) as AdminMarketRow;

    curationInputs.push({
      id: mapped.id,
      seasonId: mapped.seasonId,
      status: mapped.status,
      displayOrder: mapped.displayOrder,
      treasuryConvictionCope: mapped.treasuryConvictionCope,
      resolutionCriteria: mapped.resolutionCriteria,
      closesAt: mapped.closesAt,
      createdAt: mapped.createdAt,
    });

    if (mapped.status === "draft") drafts.push(mapped);
    else if (mapped.status === "open") open.push(mapped);
    else if (mapped.status === "closed") closed.push(mapped);
    else terminal.push(mapped);
  }

  return {
    candidates,
    drafts,
    open,
    closed,
    terminal,
    curationReport: analyzeSeasonLaunch(
      curationInputs,
      getCurrentSeasonMarketId(),
    ),
  };
}

export type { MarketRow };
