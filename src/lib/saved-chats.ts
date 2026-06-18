import { USER_DISPLAY_NAME } from "@/components/avatar-placeholder";
import type { ChatMessage } from "@/components/debate-chat";

import type { VoteChoice } from "@/lib/vote";
import type { MarketSnapshot } from "@/lib/market";
import { seedMarketData, shouldAttachMarket } from "@/lib/market";

import { getRoomCreatorSessionId } from "@/lib/room-creator";
import { MAX_ROOM_ATTENTION } from "@/lib/room-follow-up";

export type SavedConversation = {
  id: string;
  slug: string;
  belief: string;
  createdAt: string;
  messages: ChatMessage[];
  participants: string[];
  creatorId: string;
  attentionRemaining: number;
  userVote?: VoteChoice | null;
  believeCount?: number;
  copeCount?: number;
  market?: MarketSnapshot;
};

const STORAGE_KEY = "cope-fun:saved-conversations";

const EMPTY_CONVERSATIONS: SavedConversation[] = [];

let conversationsSnapshot = EMPTY_CONVERSATIONS;
let conversationsSnapshotRaw: string | null = null;
const listeners = new Set<() => void>();

function invalidateConversationsSnapshot() {
  conversationsSnapshotRaw = null;
}

function refreshConversationsSnapshot(): SavedConversation[] {
  if (typeof window === "undefined") return EMPTY_CONVERSATIONS;

  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === conversationsSnapshotRaw) return conversationsSnapshot;

  conversationsSnapshotRaw = raw;

  try {
    const parsed = raw ? (JSON.parse(raw) as SavedConversation[]) : [];
    conversationsSnapshot = Array.isArray(parsed)
      ? [...parsed]
          .map(normalizeConversation)
          .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      : EMPTY_CONVERSATIONS;
  } catch {
    conversationsSnapshot = EMPTY_CONVERSATIONS;
  }

  return conversationsSnapshot;
}

function notifySavedChatsListeners() {
  invalidateConversationsSnapshot();
  refreshConversationsSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeSavedChats(listener: () => void) {
  listeners.add(listener);

  const onStorage = () => notifySavedChatsListeners();
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSavedChatsSnapshot(): SavedConversation[] {
  return refreshConversationsSnapshot();
}

export const SAVED_CHATS_SERVER_SNAPSHOT = EMPTY_CONVERSATIONS;

export function getSavedConversationSnapshotBySlug(
  slug: string,
): SavedConversation | null {
  return (
    refreshConversationsSnapshot().find(
      (conversation) => conversation.slug === slug,
    ) ?? null
  );
}

export const SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT = null;

function slugifyBelief(belief: string): string {
  const base = belief
    .toLowerCase()
    .trim()
    .slice(0, 40)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "chat";
}

export function createConversationSlug(belief: string): string {
  const suffix = Date.now().toString(36).slice(-6);
  return `${slugifyBelief(belief)}-${suffix}`;
}

export function getParticipants(messages: ChatMessage[]): string[] {
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

function readAll(): SavedConversation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedConversation[];
    return Array.isArray(parsed) ? parsed.map(normalizeConversation) : [];
  } catch {
    return [];
  }
}

function normalizeConversation(
  conversation: SavedConversation,
): SavedConversation {
  return {
    ...conversation,
    creatorId: conversation.creatorId ?? "",
    attentionRemaining:
      typeof conversation.attentionRemaining === "number"
        ? Math.max(0, Math.min(MAX_ROOM_ATTENTION, conversation.attentionRemaining))
        : MAX_ROOM_ATTENTION,
  };
}

function writeAll(conversations: SavedConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function getSavedConversations(): SavedConversation[] {
  return refreshConversationsSnapshot();
}

export function getSavedConversationBySlug(
  slug: string,
): SavedConversation | null {
  return readAll().find((conversation) => conversation.slug === slug) ?? null;
}

export function saveConversation(input: {
  belief: string;
  messages: ChatMessage[];
  userVote?: VoteChoice | null;
  believeCount?: number;
  copeCount?: number;
}): SavedConversation {
  const believeCount = input.believeCount ?? 0;
  const copeCount = input.copeCount ?? 0;
  const hasVote = input.userVote != null;
  const market =
    hasVote &&
    believeCount + copeCount > 0 &&
    shouldAttachMarket(input.belief)
      ? seedMarketData(input.belief, believeCount, copeCount)
      : undefined;

  const conversation: SavedConversation = {
    id: crypto.randomUUID(),
    slug: createConversationSlug(input.belief),
    belief: input.belief,
    createdAt: new Date().toISOString(),
    messages: input.messages,
    participants: getParticipants(input.messages),
    creatorId: getRoomCreatorSessionId(),
    attentionRemaining: MAX_ROOM_ATTENTION,
    userVote: input.userVote ?? null,
    believeCount: input.believeCount,
    copeCount: input.copeCount,
    market,
  };

  writeAll([conversation, ...readAll()]);
  notifySavedChatsListeners();
  return conversation;
}

export function updateSavedConversation(
  slug: string,
  patch: Partial<
    Pick<
      SavedConversation,
      "messages" | "attentionRemaining" | "creatorId" | "participants"
    >
  >,
): SavedConversation | null {
  const conversations = readAll();
  const index = conversations.findIndex(
    (conversation) => conversation.slug === slug,
  );
  if (index === -1) return null;

  const updated = normalizeConversation({
    ...conversations[index],
    ...patch,
    participants:
      patch.participants ??
      (patch.messages
        ? getParticipants(patch.messages)
        : conversations[index].participants),
  });

  conversations[index] = updated;
  writeAll(conversations);
  notifySavedChatsListeners();
  return updated;
}

export function claimRoomCreatorIfUnassigned(
  slug: string,
): SavedConversation | null {
  const conversation = getSavedConversationBySlug(slug);
  if (!conversation) return null;
  if (conversation.creatorId) return conversation;

  return updateSavedConversation(slug, {
    creatorId: getRoomCreatorSessionId(),
  });
}

export function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getLastMessagePreview(
  conversation: SavedConversation,
): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return "";
  const author = last.isUser ? USER_DISPLAY_NAME : last.author;
  return `${author}: ${last.text}`;
}
