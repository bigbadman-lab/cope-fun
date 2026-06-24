import "server-only";
import { getVotePercentages } from "@/lib/vote";
import type { AdminRoomAction, AdminRoomSummary } from "@/lib/admin/dashboard-types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type BeliefRoomAdminRow = {
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

const ACTION_FIELD_MAP: Record<
  AdminRoomAction,
  keyof Pick<
    BeliefRoomAdminRow,
    "is_hidden" | "is_featured" | "is_market_candidate"
  >
> = {
  hide: "is_hidden",
  unhide: "is_hidden",
  feature: "is_featured",
  unfeature: "is_featured",
  mark_market_candidate: "is_market_candidate",
  remove_market_candidate: "is_market_candidate",
};

function getActionValue(action: AdminRoomAction): boolean {
  return (
    action === "hide" ||
    action === "feature" ||
    action === "mark_market_candidate"
  );
}

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

function toRoomSummary(
  room: BeliefRoomAdminRow,
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

async function buildRoomSummary(roomId: string): Promise<AdminRoomSummary | null> {
  const supabase = createSupabaseServiceClient();
  const { data: room, error } = await supabase
    .from("belief_rooms")
    .select(
      "id, slug, belief, created_at, challenge_count, is_hidden, is_featured, is_market_candidate",
    )
    .eq("id", roomId)
    .eq("status", "published")
    .maybeSingle();

  if (error || !room) return null;

  const [votes, reactions] = await Promise.all([
    loadVoteRows([roomId]),
    loadReactionRows([roomId]),
  ]);

  return toRoomSummary(
    room as BeliefRoomAdminRow,
    aggregateVoteTotals([roomId], votes),
    aggregateReactionTotals([roomId], reactions),
  );
}

export async function applyAdminRoomAction(
  roomId: string,
  action: AdminRoomAction,
): Promise<AdminRoomSummary | null> {
  const field = ACTION_FIELD_MAP[action];
  const value = getActionValue(action);
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("belief_rooms")
    .update({
      [field]: value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("status", "published")
    .select("id")
    .maybeSingle();

  if (error || !data) return null;

  return buildRoomSummary(roomId);
}

export async function getAdminRoomSummary(
  roomId: string,
): Promise<AdminRoomSummary | null> {
  return buildRoomSummary(roomId);
}
