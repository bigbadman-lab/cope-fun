import "server-only";

import type { AppUser } from "@/lib/auth/app-user";
import { formatAppUserLabel, formatWalletAddress } from "@/lib/auth/display-label";
import {
  createPulseRoomMessage,
  listPulseRoomMessages,
  type PulseRoomMessageRow,
} from "@/lib/db/pulse-chat";
import { getAvatarPublicUrl } from "@/lib/profile/avatar-colors";
import { isPulseBeliefRoomId, PULSE_CHAT_MAX_BODY_LENGTH, PULSE_CHAT_MIN_BODY_LENGTH } from "@/lib/pulse/constants";

export { PULSE_CHAT_MAX_BODY_LENGTH, PULSE_CHAT_MIN_BODY_LENGTH };

export type PulseRoomChatAvatar = {
  type: "uploaded" | "preset" | "fallback";
  color: string | null;
  imageUrl: string | null;
  updatedAt: string | null;
};

export type PulseRoomMessageView = {
  id: string;
  beliefRoomId: string;
  userId: string | null;
  displayLabel: string | null;
  walletAddress: string | null;
  body: string;
  createdAt: string;
  avatar: PulseRoomChatAvatar;
};

const FALLBACK_AVATAR: PulseRoomChatAvatar = {
  type: "fallback",
  color: null,
  imageUrl: null,
  updatedAt: null,
};

function buildAvatar(
  author: PulseRoomMessageRow["author"],
): PulseRoomChatAvatar {
  if (!author) return FALLBACK_AVATAR;

  const imageUrl = getAvatarPublicUrl(author.avatarUrl);
  if (imageUrl) {
    return {
      type: "uploaded",
      color: author.avatarColor,
      imageUrl,
      updatedAt: author.avatarUpdatedAt,
    };
  }

  if (author.avatarColor) {
    return {
      type: "preset",
      color: author.avatarColor,
      imageUrl: null,
      updatedAt: null,
    };
  }

  return FALLBACK_AVATAR;
}

// Prefer the author's latest profile label so display-name/avatar changes are
// reflected on refetch; fall back to the label stored when the message was sent.
function resolveDisplayLabel(row: PulseRoomMessageRow): string | null {
  const author = row.author;
  if (author) {
    if (author.displayName?.trim()) return author.displayName.trim();
    if (author.walletAddress) return formatWalletAddress(author.walletAddress);
  }
  return row.displayLabel;
}

function toMessageView(row: PulseRoomMessageRow): PulseRoomMessageView {
  return {
    id: row.id,
    beliefRoomId: row.beliefRoomId,
    userId: row.userId,
    displayLabel: resolveDisplayLabel(row),
    walletAddress: row.walletAddress,
    body: row.body,
    createdAt: row.createdAt,
    avatar: buildAvatar(row.author),
  };
}

export class PulseChatRoomNotAllowedError extends Error {
  constructor() {
    super("Pulse chat is only available for the Pulse room.");
    this.name = "PulseChatRoomNotAllowedError";
  }
}

export class PulseChatInvalidBodyError extends Error {
  constructor() {
    super(
      `Message must be between ${PULSE_CHAT_MIN_BODY_LENGTH} and ${PULSE_CHAT_MAX_BODY_LENGTH} characters.`,
    );
    this.name = "PulseChatInvalidBodyError";
  }
}

function normalizeBody(body: string): string {
  return body.trim();
}

export function isValidPulseChatBody(body: string): boolean {
  const normalized = normalizeBody(body);
  return (
    normalized.length >= PULSE_CHAT_MIN_BODY_LENGTH &&
    normalized.length <= PULSE_CHAT_MAX_BODY_LENGTH
  );
}

export async function getPulseRoomChatMessages(
  beliefRoomId: string,
): Promise<PulseRoomMessageView[]> {
  if (!isPulseBeliefRoomId(beliefRoomId)) {
    throw new PulseChatRoomNotAllowedError();
  }

  const rows = await listPulseRoomMessages(beliefRoomId);
  return rows.map(toMessageView);
}

export async function postPulseRoomChatMessage(input: {
  beliefRoomId: string;
  body: string;
  user: AppUser;
}): Promise<PulseRoomMessageView> {
  if (!isPulseBeliefRoomId(input.beliefRoomId)) {
    throw new PulseChatRoomNotAllowedError();
  }

  const body = normalizeBody(input.body);
  if (!isValidPulseChatBody(body)) {
    throw new PulseChatInvalidBodyError();
  }

  const row = await createPulseRoomMessage({
    beliefRoomId: input.beliefRoomId,
    userId: input.user.id,
    displayLabel: formatAppUserLabel(input.user),
    walletAddress: input.user.walletAddress,
    body,
  });

  return toMessageView(row);
}
