import "server-only";
import type { VoteChoice } from "@/lib/vote";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "./anonymous-session";

export type RoomVoteTotals = {
  believeCount: number;
  copeCount: number;
};

export type RoomVoteState = RoomVoteTotals & {
  userVote: VoteChoice | null;
};

type BeliefRoomVoteRow = {
  vote_type: VoteChoice;
};

function isVoteChoice(value: unknown): value is VoteChoice {
  return value === "believe" || value === "cope";
}

export async function getRoomVoteTotals(roomId: string): Promise<RoomVoteTotals> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_votes")
    .select("vote_type")
    .eq("room_id", roomId);

  if (error || !data) {
    return { believeCount: 0, copeCount: 0 };
  }

  let believeCount = 0;
  let copeCount = 0;

  for (const row of data as BeliefRoomVoteRow[]) {
    if (row.vote_type === "believe") believeCount += 1;
    if (row.vote_type === "cope") copeCount += 1;
  }

  return { believeCount, copeCount };
}

export async function getUserRoomVote(
  roomId: string,
  anonymousSessionId: string,
): Promise<VoteChoice | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_votes")
    .select("vote_type")
    .eq("room_id", roomId)
    .eq("anonymous_session_id", anonymousSessionId)
    .maybeSingle();

  if (error || !data) return null;
  return isVoteChoice(data.vote_type) ? data.vote_type : null;
}

export async function getRoomVoteStateForSession(
  roomId: string,
  anonymousToken: string,
): Promise<RoomVoteState> {
  const session = await getOrCreateAnonymousSession(anonymousToken);
  const [totals, userVote] = await Promise.all([
    getRoomVoteTotals(roomId),
    getUserRoomVote(roomId, session.id),
  ]);

  return { ...totals, userVote };
}

export async function upsertRoomVote(input: {
  roomId: string;
  anonymousToken: string;
  vote: VoteChoice;
}): Promise<RoomVoteState> {
  const session = await getOrCreateAnonymousSession(input.anonymousToken);
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from("belief_room_votes").upsert(
    {
      room_id: input.roomId,
      anonymous_session_id: session.id,
      vote_type: input.vote,
    },
    { onConflict: "room_id,anonymous_session_id" },
  );

  if (error) {
    throw new Error("Could not save room vote.");
  }

  return getRoomVoteStateForSession(input.roomId, input.anonymousToken);
}

export async function getPublishedRoomIdBySlug(
  slug: string,
): Promise<string | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_rooms")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}
