import "server-only";
import {
  EMPTY_REACTION_COUNTS,
  type MessageReactionCounts,
  type ReactionType,
} from "@/lib/message-reactions";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const REACTION_TYPES = new Set<ReactionType>([
  "smart",
  "convincing",
  "not_sure",
  "cope",
]);

export type MessageReactionState = {
  counts: MessageReactionCounts;
  userReaction: ReactionType | null;
};

export type RoomMessageReactionsMap = Record<string, MessageReactionState>;

type ReactionRow = {
  message_id: string;
  reaction: ReactionType;
  user_id: string | null;
  anonymous_session_id: string | null;
};

type MessageKeyRow = {
  id: string;
  client_message_id: string | null;
};

export function isReactionType(value: unknown): value is ReactionType {
  return (
    typeof value === "string" && REACTION_TYPES.has(value as ReactionType)
  );
}

function emptyCounts(): MessageReactionCounts {
  return { ...EMPTY_REACTION_COUNTS };
}

function aggregateCounts(reactions: ReactionType[]): MessageReactionCounts {
  const counts = emptyCounts();
  for (const reaction of reactions) {
    counts[reaction] += 1;
  }
  return counts;
}

export async function resolveRoomMessageId(
  roomId: string,
  messageId: string,
): Promise<string | null> {
  const supabase = createSupabaseServiceClient();

  const { data: byClient, error: clientError } = await supabase
    .from("belief_room_messages")
    .select("id")
    .eq("room_id", roomId)
    .eq("client_message_id", messageId)
    .maybeSingle();

  if (!clientError && byClient) return byClient.id;

  const { data: byId, error: idError } = await supabase
    .from("belief_room_messages")
    .select("id")
    .eq("room_id", roomId)
    .eq("id", messageId)
    .maybeSingle();

  if (idError || !byId) return null;
  return byId.id;
}

function getMessageKey(message: MessageKeyRow): string {
  return message.client_message_id ?? message.id;
}

export async function getMessageReactionState(
  roomId: string,
  dbMessageId: string,
  userId?: string | null,
): Promise<MessageReactionState> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("belief_room_message_reactions")
    .select("reaction, user_id, anonymous_session_id")
    .eq("room_id", roomId)
    .eq("message_id", dbMessageId);

  if (error || !data) {
    return { counts: emptyCounts(), userReaction: null };
  }

  const rows = data as ReactionRow[];
  const counts = aggregateCounts(rows.map((row) => row.reaction));
  const userReaction =
    userId == null
      ? null
      : (rows.find((row) => row.user_id === userId)?.reaction ?? null);

  return { counts, userReaction };
}

export async function getRoomMessageReactions(
  roomId: string,
  userId?: string | null,
): Promise<RoomMessageReactionsMap> {
  const supabase = createSupabaseServiceClient();

  const { data: messages, error: messagesError } = await supabase
    .from("belief_room_messages")
    .select("id, client_message_id")
    .eq("room_id", roomId);

  if (messagesError || !messages) return {};

  const messageKeys = new Map<string, string>();
  for (const message of messages as MessageKeyRow[]) {
    messageKeys.set(message.id, getMessageKey(message));
  }

  const { data: reactions, error: reactionsError } = await supabase
    .from("belief_room_message_reactions")
    .select("message_id, reaction, user_id, anonymous_session_id")
    .eq("room_id", roomId);

  if (reactionsError || !reactions) return {};

  const grouped = new Map<string, ReactionRow[]>();
  for (const row of reactions as ReactionRow[]) {
    const key = messageKeys.get(row.message_id);
    if (!key) continue;
    const existing = grouped.get(key) ?? [];
    existing.push(row);
    grouped.set(key, existing);
  }

  const result: RoomMessageReactionsMap = {};
  for (const [key, rows] of grouped) {
    result[key] = {
      counts: aggregateCounts(rows.map((row) => row.reaction)),
      userReaction:
        userId == null
          ? null
          : (rows.find((row) => row.user_id === userId)?.reaction ?? null),
    };
  }

  return result;
}

export async function upsertMessageReaction(input: {
  roomId: string;
  dbMessageId: string;
  userId: string;
  reaction: ReactionType;
}): Promise<MessageReactionState> {
  const supabase = createSupabaseServiceClient();

  const { data: existing, error: existingError } = await supabase
    .from("belief_room_message_reactions")
    .select("id, reaction")
    .eq("message_id", input.dbMessageId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Could not load message reaction.");
  }

  if (existing?.reaction === input.reaction) {
    const { error: deleteError } = await supabase
      .from("belief_room_message_reactions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      throw new Error("Could not remove message reaction.");
    }
  } else if (existing) {
    const { error: updateError } = await supabase
      .from("belief_room_message_reactions")
      .update({ reaction: input.reaction })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error("Could not update message reaction.");
    }
  } else {
    const { error: insertError } = await supabase
      .from("belief_room_message_reactions")
      .insert({
        room_id: input.roomId,
        message_id: input.dbMessageId,
        user_id: input.userId,
        reaction: input.reaction,
      });

    if (insertError) {
      throw new Error("Could not save message reaction.");
    }
  }

  return getMessageReactionState(input.roomId, input.dbMessageId, input.userId);
}
