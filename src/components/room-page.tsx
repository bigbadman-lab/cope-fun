"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { InnerPageShell } from "./inner-page-shell";
import { SavedChatView } from "./saved-chat-view";
import {
  getSavedConversationSnapshotBySlug,
  SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT,
  subscribeSavedChats,
  type SavedConversation,
} from "@/lib/saved-chats";
import type { RoomMarketView } from "@/lib/markets/types";
import type { PulseStatusResponse } from "./pulse/use-pulse-room";

type RoomPageProps = {
  slug: string;
  initialConversation?: SavedConversation | null;
  initialMarket?: RoomMarketView | null;
  initialPulseStatus?: PulseStatusResponse | null;
};

export function RoomPage({
  slug,
  initialConversation = null,
  initialMarket = null,
  initialPulseStatus = null,
}: RoomPageProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const getSnapshot = useCallback(
    () => getSavedConversationSnapshotBySlug(slug),
    [slug],
  );

  const conversation = useSyncExternalStore(
    subscribeSavedChats,
    getSnapshot,
    () => SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT,
  );

  if (initialConversation) {
    return (
      <InnerPageShell variant="room">
        <SavedChatView
          key={slug}
          conversation={initialConversation}
          dbBacked
          initialMarket={initialMarket}
          initialPulseStatus={initialPulseStatus}
        />
      </InnerPageShell>
    );
  }

  if (!isClient) {
    return <InnerPageShell variant="room" />;
  }

  if (!conversation) {
    return (
      <InnerPageShell variant="scroll" centerMain mainClassName="px-4">
        <p className="text-sm text-zinc-500">Belief not found.</p>
        <Link
          href="/beliefs"
          className="mt-4 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Back to Beliefs
        </Link>
      </InnerPageShell>
    );
  }

  return (
    <InnerPageShell variant="room">
      <SavedChatView key={slug} conversation={conversation} />
    </InnerPageShell>
  );
}
