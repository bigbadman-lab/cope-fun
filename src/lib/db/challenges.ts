import "server-only";
import { randomUUID } from "node:crypto";
import type { ChatMessage } from "@/components/debate-chat";
import { generateFollowUpReplies } from "@/lib/cope-engine/follow-up";
import type { AgentSlug } from "@/lib/agent-profiles";
import { AGENT_PROFILES } from "@/lib/agent-profiles";
import type { SavedConversation } from "@/lib/saved-chats";
import {
  buildFollowUpResponse,
  pickRespondingAgents,
  validateFollowUpDraft,
} from "@/lib/room-follow-up";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "./anonymous-session";
import { loadBeliefRoomBySlug } from "./rooms";
import { ANALYTICS_EVENTS, trackEvent } from "./analytics";

const USER_DISPLAY_NAME = "You";

type BeliefRoomRow = {
  id: string;
  slug: string;
  belief: string;
  creator_anonymous_session_id: string;
  attention_remaining: number;
  max_attention: number;
  challenge_count: number;
};

type BeliefRoomMessageRow = {
  id: string;
  room_id: string;
  client_message_id: string | null;
  sort_order: number;
  author_type: "creator" | "engine" | "agent";
  author_name: string;
  agent_slug: string | null;
  text: string;
  is_user: boolean;
  is_attention_challenge: boolean;
};

export class RoomChallengeError extends Error {
  status: 400 | 403 | 404 | 409 | 500;

  constructor(message: string, status: 400 | 403 | 404 | 409 | 500) {
    super(message);
    this.status = status;
  }
}

export type SubmitRoomChallengeInput = {
  slug: string;
  anonymousToken: string;
  challengeText: string;
  clientChallengeId?: string;
};

export type SubmitRoomChallengeResult = {
  room: SavedConversation;
  agentReplies: ChatMessage[];
  agents: string[];
  attentionRemaining: number;
  challengeCount: number;
};

function toChatMessage(message: BeliefRoomMessageRow): ChatMessage {
  return {
    id: message.client_message_id ?? message.id,
    author: message.is_user ? USER_DISPLAY_NAME : message.author_name,
    text: message.text,
    isUser: message.is_user || undefined,
    isAttentionChallenge: message.is_attention_challenge || undefined,
  };
}

function buildFallbackAgentReplies(
  belief: string,
  challengeText: string,
  clientChallengeId: string,
): ChatMessage[] {
  return pickRespondingAgents(challengeText).map((agent, index) => ({
    id: `followup-agent-${clientChallengeId}-${agent}-${index}`,
    author: agent,
    text: buildFollowUpResponse(agent, belief, challengeText),
  }));
}

async function getPublishedRoomRow(slug: string): Promise<BeliefRoomRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_rooms")
    .select(
      "id, slug, belief, creator_anonymous_session_id, attention_remaining, max_attention, challenge_count",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as BeliefRoomRow;
}

async function getMaxSortOrder(roomId: string): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_messages")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return -1;
  return data.sort_order;
}

async function getExistingChallengeRound(
  roomId: string,
  clientChallengeId: string,
): Promise<BeliefRoomMessageRow[] | null> {
  const supabase = createSupabaseServiceClient();
  const { data: challengeMessage, error } = await supabase
    .from("belief_room_messages")
    .select("*")
    .eq("room_id", roomId)
    .eq("client_message_id", clientChallengeId)
    .maybeSingle();

  if (error || !challengeMessage) return null;

  const challengeRow = challengeMessage as BeliefRoomMessageRow;
  const { data: followingMessages, error: followingError } = await supabase
    .from("belief_room_messages")
    .select("*")
    .eq("room_id", roomId)
    .gt("sort_order", challengeRow.sort_order)
    .order("sort_order", { ascending: true });

  if (followingError || !followingMessages) return [challengeRow];

  const agentRows = (followingMessages as BeliefRoomMessageRow[]).filter(
    (message) => message.author_type === "agent",
  );

  return [challengeRow, ...agentRows];
}

async function rollbackAttentionDecrement(roomId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: room, error: readError } = await supabase
    .from("belief_rooms")
    .select("attention_remaining, challenge_count")
    .eq("id", roomId)
    .single();

  if (readError || !room) return;

  await supabase
    .from("belief_rooms")
    .update({
      attention_remaining: room.attention_remaining + 1,
      challenge_count: Math.max(0, room.challenge_count - 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);
}

async function loadRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as BeliefRoomMessageRow[]).map(toChatMessage);
}

function getAgentSlugByName(author: string): AgentSlug | null {
  return AGENT_PROFILES.find((agent) => agent.name === author)?.slug ?? null;
}

export async function submitRoomChallenge({
  slug,
  anonymousToken,
  challengeText,
  clientChallengeId,
}: SubmitRoomChallengeInput): Promise<SubmitRoomChallengeResult> {
  const trimmedChallenge = challengeText.trim();
  const validationError = validateFollowUpDraft(trimmedChallenge);
  if (validationError) {
    throw new RoomChallengeError(validationError, 400);
  }

  const session = await getOrCreateAnonymousSession(anonymousToken);
  const room = await getPublishedRoomRow(slug);
  if (!room) {
    throw new RoomChallengeError("Room not found.", 404);
  }

  if (session.id !== room.creator_anonymous_session_id) {
    throw new RoomChallengeError("Only the room creator can submit challenges.", 403);
  }

  const challengeId = clientChallengeId?.trim() || randomUUID();

  const existingRound = await getExistingChallengeRound(room.id, challengeId);
  if (existingRound) {
    const agentReplies = existingRound
      .filter((message) => message.author_type === "agent")
      .map(toChatMessage);
    const loadedRoom = await loadBeliefRoomBySlug(slug);
    if (!loadedRoom) {
      throw new RoomChallengeError("Room not found.", 404);
    }
    return {
      room: loadedRoom,
      agentReplies,
      agents: agentReplies.map((message) => message.author),
      attentionRemaining: loadedRoom.attentionRemaining,
      challengeCount: room.challenge_count,
    };
  }

  if (room.attention_remaining <= 0) {
    throw new RoomChallengeError("No attention remaining.", 409);
  }

  const supabase = createSupabaseServiceClient();
  const { data: updatedRoom, error: updateError } = await supabase
    .from("belief_rooms")
    .update({
      attention_remaining: room.attention_remaining - 1,
      challenge_count: room.challenge_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id)
    .eq("creator_anonymous_session_id", session.id)
    .eq("attention_remaining", room.attention_remaining)
    .gt("attention_remaining", 0)
    .select(
      "id, slug, belief, creator_anonymous_session_id, attention_remaining, max_attention, challenge_count",
    )
    .maybeSingle();

  if (updateError || !updatedRoom) {
    throw new RoomChallengeError("No attention remaining.", 409);
  }

  const nextSortOrder = (await getMaxSortOrder(room.id)) + 1;

  const { error: insertChallengeError } = await supabase
    .from("belief_room_messages")
    .insert({
      room_id: room.id,
      client_message_id: challengeId,
      sort_order: nextSortOrder,
      author_type: "creator",
      author_name: USER_DISPLAY_NAME,
      agent_slug: null,
      text: trimmedChallenge,
      is_user: true,
      is_attention_challenge: true,
      metadata: {},
    });

  if (insertChallengeError) {
    if (insertChallengeError.code === "23505") {
      const duplicateRound = await getExistingChallengeRound(room.id, challengeId);
      if (duplicateRound) {
        await rollbackAttentionDecrement(room.id);
        const freshRoom = await getPublishedRoomRow(slug);
        const agentReplies = duplicateRound
          .filter((message) => message.author_type === "agent")
          .map(toChatMessage);
        const loadedRoom = await loadBeliefRoomBySlug(slug);
        if (!loadedRoom) {
          throw new RoomChallengeError("Room not found.", 404);
        }
        return {
          room: loadedRoom,
          agentReplies,
          agents: agentReplies.map((message) => message.author),
          attentionRemaining: loadedRoom.attentionRemaining,
          challengeCount: freshRoom?.challenge_count ?? room.challenge_count,
        };
      }
    }

    await rollbackAttentionDecrement(room.id);
    throw new RoomChallengeError("Could not save challenge.", 500);
  }

  const messagesForAi = await loadRoomMessages(room.id);
  const nextAttention = (updatedRoom as BeliefRoomRow).attention_remaining;

  let agentReplies: ChatMessage[] = [];
  try {
    const aiResult = await generateFollowUpReplies({
      belief: room.belief,
      followUp: trimmedChallenge,
      messages: messagesForAi,
      attentionRemaining: nextAttention,
    });

    if (aiResult.ok && aiResult.messages.length >= 2) {
      agentReplies = aiResult.messages.slice(0, 3).map((message, index) => ({
        ...message,
        id: message.id || `followup-agent-${challengeId}-${message.author}-${index}`,
      }));
    } else {
      agentReplies = buildFallbackAgentReplies(
        room.belief,
        trimmedChallenge,
        challengeId,
      );
    }
  } catch {
    agentReplies = buildFallbackAgentReplies(
      room.belief,
      trimmedChallenge,
      challengeId,
    );
  }

  const agentInserts = agentReplies.map((message, index) => ({
    room_id: room.id,
    client_message_id: message.id,
    sort_order: nextSortOrder + 1 + index,
    author_type: "agent" as const,
    author_name: message.author,
    agent_slug: getAgentSlugByName(message.author),
    text: message.text.trim(),
    is_user: false,
    is_attention_challenge: false,
    metadata: {},
  }));

  const { error: insertAgentsError } = await supabase
    .from("belief_room_messages")
    .insert(agentInserts);

  if (insertAgentsError) {
    throw new RoomChallengeError("Could not save agent replies.", 500);
  }

  const loadedRoom = await loadBeliefRoomBySlug(slug);
  if (!loadedRoom) {
    throw new RoomChallengeError("Room not found.", 404);
  }

  const updated = updatedRoom as BeliefRoomRow;

  trackEvent({
    eventName: ANALYTICS_EVENTS.attentionChallengeSubmitted,
    anonymousSessionId: session.id,
    roomId: room.id,
    metadata: {
      slug: room.slug,
      challengeCount: updated.challenge_count,
    },
  });

  return {
    room: loadedRoom,
    agentReplies,
    agents: agentReplies.map((message) => message.author),
    attentionRemaining: updated.attention_remaining,
    challengeCount: updated.challenge_count,
  };
}
