"use client";

import { MAX_ROOM_ATTENTION } from "@/lib/room-follow-up";
import { DEBATE_AGENT_NAMES } from "@/lib/agent-profiles";
import { getVotePercentages } from "@/lib/vote";
import {
  getLastMessagePreview,
  type SavedConversation,
} from "@/lib/saved-chats";
import type { RoomSearchResult } from "@/lib/room-search";

export const RECENT_BELIEFS_LIMIT = 3;

const EMPTY_RECENT_BELIEFS: RoomSearchResult[] = [];

let recentBeliefsSnapshot = EMPTY_RECENT_BELIEFS;
let highlightedBeliefId: string | null = null;
const listeners = new Set<() => void>();

function dedupeAndCap(
  items: RoomSearchResult[],
  limit = RECENT_BELIEFS_LIMIT,
): RoomSearchResult[] {
  const seen = new Set<string>();
  const next: RoomSearchResult[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    next.push(item);
    if (next.length >= limit) break;
  }

  return next;
}

function notifyRecentBeliefsListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeRecentBeliefs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentBeliefsSnapshot(): RoomSearchResult[] {
  return recentBeliefsSnapshot;
}

export function getHighlightedRecentBeliefId(): string | null {
  return highlightedBeliefId;
}

export function initializeRecentBeliefs(items: RoomSearchResult[]) {
  // Preserve an existing client snapshot (e.g. optimistic prepend after save)
  // so stale SSR props do not clobber fresher state. Mount refetch is the
  // eventual source of truth.
  if (recentBeliefsSnapshot.length > 0) return;

  recentBeliefsSnapshot = dedupeAndCap(items);
  // No listener notify: this may run during render to seed the store before
  // the first getSnapshot() read. Callers that need a re-render after a
  // later update use prepend/refetch instead.
}

export function prependRecentBelief(item: RoomSearchResult) {
  highlightedBeliefId = item.id;
  recentBeliefsSnapshot = dedupeAndCap([item, ...recentBeliefsSnapshot]);
  notifyRecentBeliefsListeners();

  window.setTimeout(() => {
    if (highlightedBeliefId === item.id) {
      highlightedBeliefId = null;
      notifyRecentBeliefsListeners();
    }
  }, 700);
}

export async function refetchRecentBeliefs(): Promise<void> {
  try {
    const response = await fetch(
      `/api/rooms/recent?limit=${RECENT_BELIEFS_LIMIT}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;

    const payload = (await response.json()) as {
      ok: boolean;
      results?: RoomSearchResult[];
    };
    if (!payload.ok || !payload.results) return;

    recentBeliefsSnapshot = dedupeAndCap(payload.results);
    notifyRecentBeliefsListeners();
  } catch {
    // Keep the current snapshot if refetch fails.
  }
}

export function recentBeliefFromSavedRoom(
  room: SavedConversation,
): RoomSearchResult {
  const believeCount = room.believeCount ?? 0;
  const copeCount = room.copeCount ?? 0;
  const { believePct, copePct } = getVotePercentages(believeCount, copeCount);
  const preview = getLastMessagePreview(room);
  const searchSummary = preview.includes(": ")
    ? preview.slice(preview.indexOf(": ") + 2)
    : preview;

  return {
    id: room.id,
    slug: room.slug,
    belief: room.belief,
    url: `/room/${room.slug}`,
    roomTitle: null,
    searchSummary: searchSummary || null,
    createdAt: room.createdAt,
    challengeCount: 0,
    believeCount,
    copeCount,
    believePct,
    copePct,
  };
}

export function recentBeliefToConversation(
  item: RoomSearchResult,
): SavedConversation {
  const previewText = item.searchSummary?.trim() ?? "";
  const messages = previewText
    ? [
        {
          id: `${item.id}-preview`,
          author: "Mason",
          text: previewText,
        },
      ]
    : [];

  return {
    id: item.id,
    slug: item.slug,
    belief: item.belief,
    createdAt: item.createdAt,
    messages,
    participants: [...DEBATE_AGENT_NAMES],
    creatorId: "",
    attentionRemaining: MAX_ROOM_ATTENTION,
    believeCount: item.believeCount,
    copeCount: item.copeCount,
  };
}
