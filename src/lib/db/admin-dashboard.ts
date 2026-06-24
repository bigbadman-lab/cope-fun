import "server-only";
import { getVotePercentages } from "@/lib/vote";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  AdminDashboardData,
  AdminRoomSummary,
} from "@/lib/admin/dashboard-types";
import {
  getTotalChallenges,
  getTotalReactions,
  getTotalRooms,
  getTotalVotes,
} from "./analytics";

export type { AdminDashboardData, AdminRoomSummary } from "@/lib/admin/dashboard-types";

type BeliefRoomRow = {
  id: string;
  slug: string;
  belief: string;
  created_at: string;
  challenge_count: number;
  is_hidden: boolean;
  is_featured: boolean;
  is_market_candidate: boolean;
};

type BeliefRoomVoteRow = {
  room_id: string;
  vote_type: "believe" | "cope";
};

type BeliefRoomReactionRow = {
  room_id: string;
};

const LEADERBOARD_LIMIT = 8;
const RECENT_ROOMS_LIMIT = 8;

function aggregateVoteTotals(
  roomIds: string[],
  votes: BeliefRoomVoteRow[],
): Map<string, { believeCount: number; copeCount: number }> {
  const totals = new Map<string, { believeCount: number; copeCount: number }>();

  for (const roomId of roomIds) {
    totals.set(roomId, { believeCount: 0, copeCount: 0 });
  }

  for (const vote of votes) {
    const current = totals.get(vote.room_id);
    if (!current) continue;
    if (vote.vote_type === "believe") current.believeCount += 1;
    if (vote.vote_type === "cope") current.copeCount += 1;
  }

  return totals;
}

function aggregateReactionTotals(
  roomIds: string[],
  reactions: BeliefRoomReactionRow[],
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const roomId of roomIds) {
    totals.set(roomId, 0);
  }

  for (const reaction of reactions) {
    totals.set(reaction.room_id, (totals.get(reaction.room_id) ?? 0) + 1);
  }

  return totals;
}

function toRoomSummary(
  room: BeliefRoomRow,
  voteTotals: Map<string, { believeCount: number; copeCount: number }>,
  reactionTotals: Map<string, number>,
): AdminRoomSummary {
  const totals = voteTotals.get(room.id) ?? { believeCount: 0, copeCount: 0 };
  const { believePct, copePct } = getVotePercentages(
    totals.believeCount,
    totals.copeCount,
  );

  return {
    id: room.id,
    slug: room.slug,
    belief: room.belief,
    createdAt: room.created_at,
    challengeCount: room.challenge_count,
    voteCount: totals.believeCount + totals.copeCount,
    believeCount: totals.believeCount,
    copeCount: totals.copeCount,
    believePct,
    copePct,
    reactionCount: reactionTotals.get(room.id) ?? 0,
    isHidden: room.is_hidden,
    isFeatured: room.is_featured,
    isMarketCandidate: room.is_market_candidate,
  };
}

async function loadPublishedRooms(): Promise<BeliefRoomRow[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_rooms")
    .select(
      "id, slug, belief, created_at, challenge_count, is_hidden, is_featured, is_market_candidate",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("Could not load admin room data.");
  }

  return data as BeliefRoomRow[];
}

async function loadVoteRows(roomIds: string[]): Promise<BeliefRoomVoteRow[]> {
  if (roomIds.length === 0) return [];

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_votes")
    .select("room_id, vote_type")
    .in("room_id", roomIds);

  if (error || !data) {
    throw new Error("Could not load admin vote data.");
  }

  return data as BeliefRoomVoteRow[];
}

async function loadReactionRows(
  roomIds: string[],
): Promise<BeliefRoomReactionRow[]> {
  if (roomIds.length === 0) return [];

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_message_reactions")
    .select("room_id")
    .in("room_id", roomIds);

  if (error || !data) {
    throw new Error("Could not load admin reaction data.");
  }

  return data as BeliefRoomReactionRow[];
}

function sortRooms(
  rooms: AdminRoomSummary[],
  compare: (a: AdminRoomSummary, b: AdminRoomSummary) => number,
  limit: number,
): AdminRoomSummary[] {
  return [...rooms].sort(compare).slice(0, limit);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [rooms, totals] = await Promise.all([
    loadPublishedRooms(),
    Promise.all([
      getTotalRooms(),
      getTotalVotes(),
      getTotalReactions(),
      getTotalChallenges(),
    ]),
  ]);

  const roomIds = rooms.map((room) => room.id);
  const [votes, reactions] = await Promise.all([
    loadVoteRows(roomIds),
    loadReactionRows(roomIds),
  ]);

  const voteTotals = aggregateVoteTotals(roomIds, votes);
  const reactionTotals = aggregateReactionTotals(roomIds, reactions);
  const summaries = rooms.map((room) =>
    toRoomSummary(room, voteTotals, reactionTotals),
  );

  return {
    totals: {
      rooms: totals[0],
      votes: totals[1],
      reactions: totals[2],
      challenges: totals[3],
    },
    recentRooms: sortRooms(
      summaries,
      (a, b) => b.createdAt.localeCompare(a.createdAt),
      RECENT_ROOMS_LIMIT,
    ),
    mostVotedRooms: sortRooms(
      summaries,
      (a, b) => b.voteCount - a.voteCount || b.createdAt.localeCompare(a.createdAt),
      LEADERBOARD_LIMIT,
    ),
    mostChallengedRooms: sortRooms(
      summaries,
      (a, b) =>
        b.challengeCount - a.challengeCount ||
        b.createdAt.localeCompare(a.createdAt),
      LEADERBOARD_LIMIT,
    ),
    mostReactedRooms: sortRooms(
      summaries,
      (a, b) =>
        b.reactionCount - a.reactionCount ||
        b.createdAt.localeCompare(a.createdAt),
      LEADERBOARD_LIMIT,
    ),
  };
}
