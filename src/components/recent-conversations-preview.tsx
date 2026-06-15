"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ConversationListRow } from "./conversation-list-row";
import {
  getSavedChatsSnapshot,
  SAVED_CHATS_SERVER_SNAPSHOT,
  subscribeSavedChats,
} from "@/lib/saved-chats";

const RECENT_LIMIT = 3;

export function RecentConversationsPreview() {
  const conversations = useSyncExternalStore(
    subscribeSavedChats,
    getSavedChatsSnapshot,
    () => SAVED_CHATS_SERVER_SNAPSHOT,
  );

  const recent = conversations.slice(0, RECENT_LIMIT);

  if (recent.length === 0) {
    return (
      <p className="mt-10 text-center text-xs text-zinc-600">
        Saved beliefs will appear here.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <div className="mb-1 flex items-center justify-between px-0.5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Recent beliefs
        </h2>
        <Link
          href="/beliefs"
          className="text-xs text-zinc-500 transition-colors duration-300 ease-out hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          View all
        </Link>
      </div>
      <div>
        {recent.map((conversation) => (
          <ConversationListRow
            key={conversation.id}
            conversation={conversation}
          />
        ))}
      </div>
    </div>
  );
}
