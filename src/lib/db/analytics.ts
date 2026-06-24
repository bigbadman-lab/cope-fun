import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "./anonymous-session";

export const ANALYTICS_EVENTS = {
  beliefValidated: "belief_validated",
  debateGenerated: "debate_generated",
  roomSaved: "room_saved",
  roomViewed: "room_viewed",
  attentionChallengeSubmitted: "attention_challenge_submitted",
  voteCast: "vote_cast",
  reactionAdded: "reaction_added",
  searchPerformed: "search_performed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type TrackEventInput = {
  eventName: AnalyticsEventName;
  anonymousSessionId?: string | null;
  roomId?: string | null;
  metadata?: Record<string, unknown>;
};

const MIN_TOKEN_LENGTH = 16;

export async function resolveAnonymousSessionIdFromToken(
  token?: string,
): Promise<string | null> {
  const trimmed = token?.trim() ?? "";
  if (trimmed.length < MIN_TOKEN_LENGTH) return null;

  try {
    const session = await getOrCreateAnonymousSession(trimmed);
    return session.id;
  } catch {
    return null;
  }
}

async function insertAnalyticsEvent(input: TrackEventInput): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("analytics_events").insert({
    event_name: input.eventName,
    anonymous_session_id: input.anonymousSessionId ?? null,
    room_id: input.roomId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Analytics event failed:", error.message);
  }
}

export function trackEvent(input: TrackEventInput): void {
  void insertAnalyticsEvent(input).catch(() => {
    // Analytics failures must not affect user flows.
  });
}

export async function getTotalBeliefsValidated(): Promise<number> {
  try {
    const supabase = createSupabaseServiceClient();
    const { count, error } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", ANALYTICS_EVENTS.beliefValidated)
      .eq("metadata->>valid", "true");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getTotalRooms(): Promise<number> {
  try {
    const supabase = createSupabaseServiceClient();
    const { count, error } = await supabase
      .from("belief_rooms")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getTotalChallenges(): Promise<number> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("belief_rooms")
      .select("challenge_count")
      .eq("status", "published");

    if (error || !data) return 0;

    return data.reduce(
      (total, row) => total + (typeof row.challenge_count === "number" ? row.challenge_count : 0),
      0,
    );
  } catch {
    return 0;
  }
}

export async function getTotalVotes(): Promise<number> {
  try {
    const supabase = createSupabaseServiceClient();
    const { count, error } = await supabase
      .from("belief_room_votes")
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getTotalReactions(): Promise<number> {
  try {
    const supabase = createSupabaseServiceClient();
    const { count, error } = await supabase
      .from("belief_room_message_reactions")
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
