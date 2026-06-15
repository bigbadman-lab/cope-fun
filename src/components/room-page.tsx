"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { SavedChatView } from "./saved-chat-view";
import { TopNav } from "./top-nav";
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
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 min-h-0 pt-14" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <TopNav />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-x-hidden px-4 pt-14 text-center">
          <p className="text-sm text-zinc-500">Conversation not found.</p>
          <Link
            href="/conversations"
            className="mt-4 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100"
          >
            Back to Conversations
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TopNav />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-14">
        <SavedChatView
          messages={conversation.messages}
          belief={conversation.belief}
          userVote={conversation.userVote}
          believeCount={conversation.believeCount}
          copeCount={conversation.copeCount}
          market={conversation.market}
        />
      </main>
    </div>
  );
}
