"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { InnerPageShell } from "./inner-page-shell";
import { SavedChatView } from "./saved-chat-view";
import {
  getSavedConversationSnapshotBySlug,
  SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT,
  subscribeSavedChats,
} from "@/lib/saved-chats";

type RoomPageProps = {
  slug: string;
};

export function RoomPage({ slug }: RoomPageProps) {
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
      <SavedChatView conversation={conversation} />
    </InnerPageShell>
  );
}
