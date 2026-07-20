"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { ConversationListRow } from "./conversation-list-row";
import {
  getHighlightedRecentBeliefId,
  getRecentBeliefsSnapshot,
  initializeRecentBeliefs,
  recentBeliefToConversation,
  refetchRecentBeliefs,
  subscribeRecentBeliefs,
} from "@/lib/recent-beliefs";
import type { RoomSearchResult } from "@/lib/room-search";

type RecentConversationsPreviewProps = {
  initialBeliefs?: RoomSearchResult[];
};

export function RecentConversationsPreview({
  initialBeliefs = [],
}: RecentConversationsPreviewProps) {
  // Seed only when the client store is empty so first paint matches SSR and
  // an existing optimistic/client snapshot is preserved.
  if (typeof window !== "undefined") {
    initializeRecentBeliefs(initialBeliefs);
  }

  useEffect(() => {
    void refetchRecentBeliefs();
  }, []);

  const beliefs = useSyncExternalStore(
    subscribeRecentBeliefs,
    getRecentBeliefsSnapshot,
    () => initialBeliefs,
  );
  const highlightedId = useSyncExternalStore(
    subscribeRecentBeliefs,
    getHighlightedRecentBeliefId,
    () => null,
  );

  if (beliefs.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-white/70">
        Saved beliefs will appear here.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <div className="mb-1 flex items-center justify-between px-0.5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-white/65">
          Recent beliefs
        </h2>
        <Link
          href="/beliefs"
          className="text-sm text-white/65 transition-colors duration-300 ease-out hover:text-white"
        >
          View all
        </Link>
      </div>
      <div>
        {beliefs.map((belief) => (
          <div
            key={belief.id}
            className={belief.id === highlightedId ? "animate-message-in" : undefined}
          >
            <ConversationListRow
              conversation={recentBeliefToConversation(belief)}
              variant="homepage"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
