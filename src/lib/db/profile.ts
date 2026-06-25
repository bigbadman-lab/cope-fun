import "server-only";
import { formatAppUserLabel } from "@/lib/auth/display-label";
import type { AppUser } from "@/lib/auth/app-user";
import {
  COPE_CREDITS_DISCLAIMER,
  getMarketDisplayStatus,
  SEASON_1_AIRDROP_NOTE,
} from "@/lib/markets/display-status";
import { resolveAvatarPublicUrl } from "@/lib/profile/avatar-upload";
import type { MarketSide, MarketStatus } from "@/lib/markets/types";
import type {
  ProfileAccountSummary,
  ProfileCreatedRoomSummary,
  ProfileDashboard,
  ProfileMarketPositionSummary,
  ProfileSeasonSummary,
  ProfileUserSummary,
} from "@/lib/profile/types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { CreditAccountView } from "@/lib/markets/types";

const CREATED_ROOMS_LIMIT = 10;

type CreditAccountRankRow = {
  user_id: string;
  total_won_credits: number;
  markets_won: number;
  created_at: string;
};

type PositionJoinRow = {
  id: string;
  side: MarketSide;
  stake_credits: number;
  payout_credits: number | null;
  is_winner: boolean | null;
  settled_at: string | null;
  created_at: string;
  belief_room_markets: {
    id: string;
    title: string;
    status: MarketStatus;
    closes_at: string;
    resolved_at: string | null;
    outcome: MarketSide | null;
    belief_rooms: {
      slug: string;
      belief: string;
    } | Array<{
      slug: string;
      belief: string;
    }>;
  } | Array<{
    id: string;
    title: string;
    status: MarketStatus;
    closes_at: string;
    resolved_at: string | null;
    outcome: MarketSide | null;
    belief_rooms: {
      slug: string;
      belief: string;
    } | Array<{
      slug: string;
      belief: string;
    }>;
  }>;
};

type CreatedRoomRow = {
  id: string;
  slug: string;
  belief: string;
  created_at: string;
  is_hidden: boolean;
  status: "published" | "hidden" | "deleted";
};

function computeWinRate(
  marketsWon: number,
  marketsEntered: number,
): number | null {
  if (marketsEntered <= 0) return null;
  return Math.round((marketsWon / marketsEntered) * 100);
}

function toUserSummary(user: AppUser): ProfileUserSummary {
  return {
    id: user.id,
    displayName: user.displayName,
    walletAddress: user.walletAddress,
    email: user.email,
    label: formatAppUserLabel({
      id: user.id,
      displayName: user.displayName,
      walletAddress: user.walletAddress,
      email: user.email,
    }),
    linkedAnonymousSessionId: user.linkedAnonymousSessionId,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    avatarPublicUrl: resolveAvatarPublicUrl(user.avatarUrl),
    avatarUpdatedAt: user.avatarUpdatedAt,
  };
}

function toAccountSummary(account: CreditAccountView): ProfileAccountSummary {
  return {
    balanceCredits: account.balanceCredits,
    totalWonCredits: account.totalWonCredits,
    totalStakedCredits: account.totalStakedCredits,
    totalLostCredits: account.totalLostCredits,
    marketsEntered: account.marketsEntered,
    marketsWon: account.marketsWon,
    marketsLost: account.marketsLost,
    winRate: computeWinRate(account.marketsWon, account.marketsEntered),
  };
}

function unwrapRoom<T extends { slug: string; belief: string }>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function unwrapMarket(
  value: PositionJoinRow["belief_room_markets"],
): {
  id: string;
  title: string;
  status: MarketStatus;
  closes_at: string;
  resolved_at: string | null;
  outcome: MarketSide | null;
  room: { slug: string; belief: string } | null;
} | null {
  const market = Array.isArray(value) ? value[0] : value;
  if (!market) return null;

  const roomRaw = market.belief_rooms;
  const room = unwrapRoom(roomRaw);

  return {
    id: market.id,
    title: market.title,
    status: market.status,
    closes_at: market.closes_at,
    resolved_at: market.resolved_at,
    outcome: market.outcome,
    room,
  };
}

function computePnl(
  stakeCredits: number,
  payoutCredits: number | null,
  settled: boolean,
): number | null {
  if (!settled || payoutCredits === null) return null;
  return payoutCredits - stakeCredits;
}

function isResolvedPosition(
  marketStatus: MarketStatus,
  settledAt: string | null,
): boolean {
  if (settledAt) return true;
  return marketStatus === "resolved" || marketStatus === "voided";
}

function isActivePosition(
  marketStatus: MarketStatus,
  settledAt: string | null,
): boolean {
  if (settledAt) return false;
  if (
    marketStatus === "resolved" ||
    marketStatus === "voided" ||
    marketStatus === "draft"
  ) {
    return false;
  }

  return marketStatus === "open" || marketStatus === "closed";
}

function toPositionSummary(row: PositionJoinRow): ProfileMarketPositionSummary | null {
  const market = unwrapMarket(row.belief_room_markets);
  if (!market?.room) return null;

  const settled = isResolvedPosition(market.status, row.settled_at);
  const displayStatus = getMarketDisplayStatus(market.status, market.closes_at);

  return {
    id: row.id,
    marketId: market.id,
    marketTitle: market.title,
    marketStatus: market.status,
    displayStatus,
    roomSlug: market.room.slug,
    roomBelief: market.room.belief,
    side: row.side,
    stakeCredits: row.stake_credits,
    payoutCredits: row.payout_credits,
    isWinner: row.is_winner,
    closesAt: market.closes_at,
    resolvedAt: market.resolved_at,
    outcome: market.outcome,
    createdAt: row.created_at,
    pnl: computePnl(row.stake_credits, row.payout_credits, settled),
  };
}

export async function getUserLeaderboardRank(userId: string): Promise<{
  rank: number | null;
  totalPlayers: number;
}> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("cope_credit_accounts")
    .select("user_id, total_won_credits, markets_won, created_at")
    .not("user_id", "is", null)
    .order("total_won_credits", { ascending: false })
    .order("markets_won", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error("Could not load leaderboard rank.");
  }

  const rows = data as CreditAccountRankRow[];
  const totalPlayers = rows.length;
  const userRow = rows.find((row) => row.user_id === userId);

  if (!userRow || userRow.total_won_credits <= 0) {
    return { rank: null, totalPlayers };
  }

  const index = rows.findIndex((row) => row.user_id === userId);
  return { rank: index >= 0 ? index + 1 : null, totalPlayers };
}

export async function getUserMarketPositions(userId: string): Promise<{
  activePositions: ProfileMarketPositionSummary[];
  resolvedPositions: ProfileMarketPositionSummary[];
}> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("belief_market_positions")
    .select(
      `
      id,
      side,
      stake_credits,
      payout_credits,
      is_winner,
      settled_at,
      created_at,
      belief_room_markets!inner (
        id,
        title,
        status,
        closes_at,
        resolved_at,
        outcome,
        belief_rooms!inner (
          slug,
          belief
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("Could not load market positions.");
  }

  const activePositions: ProfileMarketPositionSummary[] = [];
  const resolvedPositions: ProfileMarketPositionSummary[] = [];

  for (const row of data as PositionJoinRow[]) {
    const summary = toPositionSummary(row);
    if (!summary) continue;

    const settled = isResolvedPosition(summary.marketStatus, row.settled_at);

    if (isActivePosition(summary.marketStatus, row.settled_at)) {
      activePositions.push(summary);
    }

    if (settled) {
      resolvedPositions.push(summary);
    }
  }

  return { activePositions, resolvedPositions };
}

export async function getUserCreatedBeliefRooms(
  userId: string,
  linkedAnonymousSessionId?: string | null,
): Promise<ProfileCreatedRoomSummary[]> {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("belief_rooms")
    .select("id, slug, belief, created_at, is_hidden, status")
    .in("status", ["published", "hidden"])
    .order("created_at", { ascending: false })
    .limit(CREATED_ROOMS_LIMIT * 2);

  if (linkedAnonymousSessionId) {
    query = query.or(
      `created_by_user_id.eq.${userId},creator_anonymous_session_id.eq.${linkedAnonymousSessionId}`,
    );
  } else {
    query = query.eq("created_by_user_id", userId);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new Error("Could not load created belief rooms.");
  }

  const deduped = new Map<string, ProfileCreatedRoomSummary>();

  for (const row of data as CreatedRoomRow[]) {
    if (row.status === "deleted") continue;

    deduped.set(row.id, {
      id: row.id,
      slug: row.slug,
      belief: row.belief,
      createdAt: row.created_at,
      isHidden: row.is_hidden || row.status === "hidden",
      status: row.status === "hidden" ? "hidden" : "published",
    });
  }

  return [...deduped.values()]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, CREATED_ROOMS_LIMIT);
}

export async function getAccountDashboard(
  user: AppUser,
  account: CreditAccountView,
): Promise<ProfileDashboard> {
  const [{ rank, totalPlayers }, positions, createdRooms] = await Promise.all([
    getUserLeaderboardRank(user.id),
    getUserMarketPositions(user.id),
    getUserCreatedBeliefRooms(user.id, user.linkedAnonymousSessionId),
  ]);

  const season: ProfileSeasonSummary = {
    name: "Season 1",
    rank,
    totalPlayers,
    eligibilityNote: SEASON_1_AIRDROP_NOTE,
  };

  return {
    user: toUserSummary(user),
    season,
    account: toAccountSummary(account),
    activePositions: positions.activePositions,
    resolvedPositions: positions.resolvedPositions,
    createdRooms,
  };
}

export { COPE_CREDITS_DISCLAIMER };
