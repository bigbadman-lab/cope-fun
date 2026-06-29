import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type PulseRoomMessageAuthor = {
  displayName: string | null;
  walletAddress: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
  avatarUpdatedAt: string | null;
};

export type PulseRoomMessageRow = {
  id: string;
  beliefRoomId: string;
  userId: string | null;
  displayLabel: string | null;
  walletAddress: string | null;
  body: string;
  createdAt: string;
  author: PulseRoomMessageAuthor | null;
};

type PulseRoomMessageAuthorDbRow = {
  display_name: string | null;
  wallet_address: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  avatar_updated_at: string | null;
};

type PulseRoomMessageDbRow = {
  id: string;
  belief_room_id: string;
  user_id: string | null;
  display_label: string | null;
  wallet_address: string | null;
  body: string;
  created_at: string;
  author: PulseRoomMessageAuthorDbRow | PulseRoomMessageAuthorDbRow[] | null;
};

const DEFAULT_MESSAGE_LIMIT = 200;

// Embeds the latest profile/avatar config for the message author via the
// pulse_room_messages.user_id -> app_users.id foreign key.
const PULSE_MESSAGE_SELECT =
  "id, belief_room_id, user_id, display_label, wallet_address, body, created_at, author:app_users ( display_name, wallet_address, avatar_color, avatar_url, avatar_updated_at )";

function normalizeAuthor(
  author: PulseRoomMessageDbRow["author"],
): PulseRoomMessageAuthor | null {
  const row = Array.isArray(author) ? (author[0] ?? null) : author;
  if (!row) return null;

  return {
    displayName: row.display_name,
    walletAddress: row.wallet_address,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
    avatarUpdatedAt: row.avatar_updated_at,
  };
}

function toPulseRoomMessageRow(row: PulseRoomMessageDbRow): PulseRoomMessageRow {
  return {
    id: row.id,
    beliefRoomId: row.belief_room_id,
    userId: row.user_id,
    displayLabel: row.display_label,
    walletAddress: row.wallet_address,
    body: row.body,
    createdAt: row.created_at,
    author: normalizeAuthor(row.author),
  };
}

export async function listPulseRoomMessages(
  beliefRoomId: string,
  limit = DEFAULT_MESSAGE_LIMIT,
): Promise<PulseRoomMessageRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_room_messages")
    .select(PULSE_MESSAGE_SELECT)
    .eq("belief_room_id", beliefRoomId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    toPulseRoomMessageRow(row as unknown as PulseRoomMessageDbRow),
  );
}

export type CreatePulseRoomMessageInput = {
  beliefRoomId: string;
  userId: string;
  displayLabel: string;
  walletAddress: string | null;
  body: string;
};

export async function createPulseRoomMessage(
  input: CreatePulseRoomMessageInput,
): Promise<PulseRoomMessageRow> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pulse_room_messages")
    .insert({
      belief_room_id: input.beliefRoomId,
      user_id: input.userId,
      display_label: input.displayLabel,
      wallet_address: input.walletAddress,
      body: input.body,
    })
    .select(PULSE_MESSAGE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create Pulse room message.");
  }

  return toPulseRoomMessageRow(data as unknown as PulseRoomMessageDbRow);
}
