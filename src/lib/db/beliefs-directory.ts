import "server-only";
import { getVotePercentages } from "@/lib/vote";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { PUBLIC_ROOM_LISTING_FILTERS } from "./room-visibility";

export const BELIEFS_PAGE_SIZE = 20;

export type BeliefDirectoryItem = {
  id: string;
  slug: string;
  belief: string;
  createdAt: string;
  challengeCount: number;
  believeCount: number;
  copeCount: number;
  believePct: number;
  copePct: number;
  hasPulseMarket: boolean;
};

export type BeliefDirectoryPage = {
  items: BeliefDirectoryItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type BeliefRoomListRow = {
  id: string;
  slug: string;
  belief: string;
  created_at: string;
  challenge_count: number;
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

/**
 * Returns the subset of room ids that have a Pulse engine attached. A row in
 * `pulse_engines` keyed by `belief_room_id` is the canonical signal that a
 * belief room is a live Pulse market. Failures degrade gracefully to "none"
 * so the directory still renders if the Pulse table is unavailable.
 */
async function getPulseLinkedRoomIds(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  roomIds: string[],
): Promise<Set<string>> {
  if (roomIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("pulse_engines")
    .select("belief_room_id")
    .in("belief_room_id", roomIds);

  if (error || !data) {
    return new Set();
  }

  return new Set(
    (data as { belief_room_id: string }[]).map((row) => row.belief_room_id),
  );
}

export async function listBeliefRooms(input: {
  page: number;
  pageSize?: number;
}): Promise<BeliefDirectoryPage> {
  const pageSize = input.pageSize ?? BELIEFS_PAGE_SIZE;
  const page = Math.max(1, input.page);

  const supabase = createSupabaseServiceClient();

  const { count, error: countError } = await supabase
    .from("belief_rooms")
    .select("*", { count: "exact", head: true })
    .eq("status", PUBLIC_ROOM_LISTING_FILTERS.status)
    .eq("is_hidden", PUBLIC_ROOM_LISTING_FILTERS.is_hidden);

  if (countError) {
    throw new Error("Could not load beliefs directory.");
  }

  const totalCount = count ?? 0;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);

  if (totalCount === 0) {
    return {
      items: [],
      page: 1,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const { data: rooms, error: roomsError } = await supabase
    .from("belief_rooms")
    .select("id, slug, belief, created_at, challenge_count")
    .eq("status", PUBLIC_ROOM_LISTING_FILTERS.status)
    .eq("is_hidden", PUBLIC_ROOM_LISTING_FILTERS.is_hidden)
    .order("created_at", { ascending: false })
    .range(
      (safePage - 1) * pageSize,
      (safePage - 1) * pageSize + pageSize - 1,
    );

  if (roomsError || !rooms) {
    throw new Error("Could not load beliefs directory.");
  }

  const roomRows = rooms as BeliefRoomListRow[];
  const roomIds = roomRows.map((room) => room.id);

  const { data: votes, error: votesError } = await supabase
    .from("belief_room_votes")
    .select("room_id, vote_type")
    .in("room_id", roomIds);

  if (votesError) {
    throw new Error("Could not load belief vote totals.");
  }

  const voteTotals = aggregateVoteTotals(
    roomIds,
    (votes ?? []) as BeliefRoomVoteRow[],
  );

  const pulseRoomIds = await getPulseLinkedRoomIds(supabase, roomIds);

  const items = roomRows.map((room) => {
    const totals = voteTotals.get(room.id) ?? {
      believeCount: 0,
      copeCount: 0,
    };
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
      believeCount: totals.believeCount,
      copeCount: totals.copeCount,
      believePct,
      copePct,
      hasPulseMarket: pulseRoomIds.has(room.id),
    };
  });

  return {
    items,
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
}
