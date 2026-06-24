import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import type { ChatMessage } from "@/components/debate-chat";
import type { AgentSlug } from "@/lib/agent-profiles";
import { AGENT_PROFILES } from "@/lib/agent-profiles";
import type { SavedConversation } from "@/lib/saved-chats";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "./anonymous-session";
import { ANALYTICS_EVENTS, trackEvent } from "./analytics";
import { getRoomVoteTotals } from "./votes";
import { buildRoomSearchSummary } from "./room-search";

const USER_DISPLAY_NAME = "You";
const ENGINE_AUTHOR = "Cope Engine";
const MAX_ROOM_ATTENTION = 5;
const MAX_SLUG_ATTEMPTS = 5;

type RoomStatus = "published" | "hidden" | "deleted";
type RoomMessageAuthorType = "creator" | "engine" | "agent";

type BeliefRoomRow = {
  id: string;
  slug: string;
  belief: string;
  normalized_belief: string | null;
  status: RoomStatus;
  creator_anonymous_session_id: string;
  attention_remaining: number;
  max_attention: number;
  challenge_count: number;
  room_title: string | null;
  search_summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type BeliefRoomMessageRow = {
  id: string;
  room_id: string;
  client_message_id: string | null;
  sort_order: number;
  author_type: RoomMessageAuthorType;
  author_name: string;
  agent_slug: AgentSlug | null;
  text: string;
  is_user: boolean;
  is_attention_challenge: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

type RoomMessageInsert = {
  room_id: string;
  client_message_id: string;
  sort_order: number;
  author_type: RoomMessageAuthorType;
  author_name: string;
  agent_slug: AgentSlug | null;
  text: string;
  is_user: boolean;
  is_attention_challenge: boolean;
  metadata: Record<string, unknown>;
};

export type CreateBeliefRoomInput = {
  anonymousToken: string;
  belief: string;
  messages: ChatMessage[];
  attentionRemaining?: number;
  createdByUserId?: string | null;
};

export type CreateBeliefRoomResult = {
  slug: string;
  room: SavedConversation;
};

function slugifyBelief(belief: string): string {
  const base = belief
    .toLowerCase()
    .trim()
    .slice(0, 40)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "belief";
}

function createRoomSlug(belief: string): string {
  return `${slugifyBelief(belief)}-${randomBytes(4).toString("hex")}`;
}

function getAgentSlugByName(author: string): AgentSlug | null {
  return AGENT_PROFILES.find((agent) => agent.name === author)?.slug ?? null;
}

function getAuthorType(message: ChatMessage): RoomMessageAuthorType {
  if (message.isUser) return "creator";
  if (message.author === ENGINE_AUTHOR) return "engine";
  return "agent";
}

function getParticipants(messages: ChatMessage[]): string[] {
  const seen = new Set<string>();
  const participants: string[] = [];

  for (const message of messages) {
    const name = message.isUser ? USER_DISPLAY_NAME : message.author;
    if (seen.has(name)) continue;
    seen.add(name);
    participants.push(name);
  }

  return participants;
}

function toMessageInsert(
  roomId: string,
  message: ChatMessage,
  sortOrder: number,
): RoomMessageInsert {
  const authorType = getAuthorType(message);

  return {
    room_id: roomId,
    client_message_id: message.id,
    sort_order: sortOrder,
    author_type: authorType,
    author_name: message.isUser ? USER_DISPLAY_NAME : message.author,
    agent_slug: authorType === "agent" ? getAgentSlugByName(message.author) : null,
    text: message.text.trim(),
    is_user: message.isUser === true,
    is_attention_challenge: message.isAttentionChallenge === true,
    metadata: {},
  };
}

function toChatMessage(message: BeliefRoomMessageRow): ChatMessage {
  return {
    id: message.client_message_id ?? message.id,
    author: message.is_user ? USER_DISPLAY_NAME : message.author_name,
    text: message.text,
    isUser: message.is_user || undefined,
    isAttentionChallenge: message.is_attention_challenge || undefined,
  };
}

function toSavedConversation(
  room: BeliefRoomRow,
  messageRows: BeliefRoomMessageRow[],
  voteTotals: { believeCount: number; copeCount: number },
): SavedConversation {
  const messages = [...messageRows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toChatMessage);

  return {
    id: room.id,
    slug: room.slug,
    belief: room.belief,
    createdAt: room.created_at,
    messages,
    participants: getParticipants(messages),
    creatorId: "",
    attentionRemaining: Math.max(
      0,
      Math.min(room.max_attention || MAX_ROOM_ATTENTION, room.attention_remaining),
    ),
    userVote: null,
    believeCount: voteTotals.believeCount,
    copeCount: voteTotals.copeCount,
  };
}

async function insertRoom(input: {
  belief: string;
  anonymousSessionId: string;
  attentionRemaining: number;
  createdByUserId?: string | null;
}): Promise<BeliefRoomRow> {
  const supabase = createSupabaseServiceClient();

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from("belief_rooms")
      .insert({
        slug: createRoomSlug(input.belief),
        belief: input.belief,
        normalized_belief: input.belief,
        status: "published",
        creator_anonymous_session_id: input.anonymousSessionId,
        created_by_user_id: input.createdByUserId ?? null,
        attention_remaining: input.attentionRemaining,
        max_attention: MAX_ROOM_ATTENTION,
        challenge_count: 0,
        room_title: input.belief,
        metadata: {},
      })
      .select("*")
      .single();

    if (!error && data) return data as BeliefRoomRow;
    if (error?.code !== "23505") {
      throw new Error("Could not create belief room.");
    }
  }

  throw new Error("Could not create a unique room slug.");
}

export async function createBeliefRoom({
  anonymousToken,
  belief,
  messages,
  attentionRemaining,
  createdByUserId = null,
}: CreateBeliefRoomInput): Promise<CreateBeliefRoomResult> {
  const anonymousSession = await getOrCreateAnonymousSession(anonymousToken);
  const safeAttentionRemaining =
    typeof attentionRemaining === "number"
      ? Math.max(0, Math.min(MAX_ROOM_ATTENTION, attentionRemaining))
      : MAX_ROOM_ATTENTION;

  const room = await insertRoom({
    belief: belief.trim(),
    anonymousSessionId: anonymousSession.id,
    attentionRemaining: safeAttentionRemaining,
    createdByUserId,
  });

  const messageInserts = messages.map((message, index) =>
    toMessageInsert(room.id, message, index),
  );

  const supabase = createSupabaseServiceClient();
  const { data: insertedMessages, error } = await supabase
    .from("belief_room_messages")
    .insert(messageInserts)
    .select("*");

  if (error || !insertedMessages) {
    await supabase.from("belief_rooms").delete().eq("id", room.id);
    throw new Error("Could not create belief room messages.");
  }

  const searchSummary = buildRoomSearchSummary(messages);
  if (searchSummary) {
    await supabase
      .from("belief_rooms")
      .update({ search_summary: searchSummary })
      .eq("id", room.id);
  }

  trackEvent({
    eventName: ANALYTICS_EVENTS.roomSaved,
    anonymousSessionId: anonymousSession.id,
    roomId: room.id,
    metadata: {
      slug: room.slug,
      messageCount: messages.length,
    },
  });

  return {
    slug: room.slug,
    room: toSavedConversation(
      room,
      insertedMessages as BeliefRoomMessageRow[],
      { believeCount: 0, copeCount: 0 },
    ),
  };
}

export async function loadBeliefRoomBySlug(
  slug: string,
): Promise<SavedConversation | null> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data: room, error: roomError } = await supabase
      .from("belief_rooms")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (roomError || !room) return null;

    const { data: messages, error: messagesError } = await supabase
      .from("belief_room_messages")
      .select("*")
      .eq("room_id", room.id)
      .order("sort_order", { ascending: true });

    if (messagesError || !messages) return null;

    const voteTotals = await getRoomVoteTotals(room.id);

    return toSavedConversation(
      room as BeliefRoomRow,
      messages as BeliefRoomMessageRow[],
      voteTotals,
    );
  } catch {
    return null;
  }
}

export const getBeliefRoomBySlug = cache(loadBeliefRoomBySlug);
