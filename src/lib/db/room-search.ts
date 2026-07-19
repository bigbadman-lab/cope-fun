import "server-only";
import type { ChatMessage } from "@/components/debate-chat";
import {
  SEARCH_RESULT_LIMIT,
  type RoomSearchResult,
} from "@/lib/room-search";
import { getVotePercentages } from "@/lib/vote";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { PUBLIC_ROOM_LISTING_FILTERS } from "./room-visibility";

export { SEARCH_RESULT_LIMIT, type RoomSearchResult };

type BeliefRoomSearchRow = {
  id: string;
  slug: string;
  belief: string;
  room_title: string | null;
  search_summary: string | null;
  created_at: string;
  challenge_count: number;
  rank?: number;
};

type BeliefRoomVoteRow = {
  room_id: string;
  vote_type: "believe" | "cope";
};

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

function toSearchResult(
  room: BeliefRoomSearchRow,
  totals: { believeCount: number; copeCount: number },
): RoomSearchResult {
  const { believePct, copePct } = getVotePercentages(
    totals.believeCount,
    totals.copeCount,
  );

  return {
    id: room.id,
    slug: room.slug,
    belief: room.belief,
    url: `/room/${room.slug}`,
    roomTitle: room.room_title,
    searchSummary: room.search_summary,
    createdAt: room.created_at,
    challengeCount: room.challenge_count,
    believeCount: totals.believeCount,
    copeCount: totals.copeCount,
    believePct,
    copePct,
  };
}

async function attachVoteTotals(
  rooms: BeliefRoomSearchRow[],
): Promise<RoomSearchResult[]> {
  if (rooms.length === 0) return [];

  const supabase = createSupabaseServiceClient();
  const roomIds = rooms.map((room) => room.id);

  const { data: votes, error } = await supabase
    .from("belief_room_votes")
    .select("room_id, vote_type")
    .in("room_id", roomIds);

  if (error) {
    throw new Error("Could not load search vote totals.");
  }

  const voteTotals = aggregateVoteTotals(
    roomIds,
    (votes ?? []) as BeliefRoomVoteRow[],
  );

  return rooms.map((room) =>
    toSearchResult(room, voteTotals.get(room.id) ?? { believeCount: 0, copeCount: 0 }),
  );
}

async function listRecentPublishedRooms(
  limit: number,
): Promise<BeliefRoomSearchRow[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_rooms")
    .select(
      "id, slug, belief, room_title, search_summary, created_at, challenge_count",
    )
    .eq("status", PUBLIC_ROOM_LISTING_FILTERS.status)
    .eq("is_hidden", PUBLIC_ROOM_LISTING_FILTERS.is_hidden)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new Error("Could not load recent beliefs.");
  }

  return data as BeliefRoomSearchRow[];
}

export async function getRecentPublishedBeliefs(
  limit = 3,
): Promise<RoomSearchResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 10));
  return attachVoteTotals(await listRecentPublishedRooms(safeLimit));
}

export async function searchBeliefRooms(
  rawQuery: string,
  limit = SEARCH_RESULT_LIMIT,
): Promise<RoomSearchResult[]> {
  const query = rawQuery.trim();
  const safeLimit = Math.max(1, Math.min(limit, 50));

  if (!query) {
    return attachVoteTotals(await listRecentPublishedRooms(safeLimit));
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("search_belief_rooms", {
    search_query: query,
    result_limit: safeLimit,
  });

  if (error) {
    throw new Error("Could not search beliefs.");
  }

  return attachVoteTotals((data ?? []) as BeliefRoomSearchRow[]);
}

export function buildRoomSearchSummary(messages: ChatMessage[]): string | null {
  const ENGINE_AUTHOR = "Swarm Engine";
  const parts = messages
    .filter((message) => !message.isUser && message.author !== ENGINE_AUTHOR)
    .map((message) => message.text.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (parts.length === 0) return null;
  return parts.join(" ").slice(0, 500);
}
