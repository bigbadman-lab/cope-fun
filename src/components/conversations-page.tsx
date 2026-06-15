"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ConversationListRow } from "./conversation-list-row";
import { TopNav } from "./top-nav";
import {
  getSavedChatsSnapshot,
  SAVED_CHATS_SERVER_SNAPSHOT,
  subscribeSavedChats,
} from "@/lib/saved-chats";

export function ConversationsPage() {
  const conversations = useSyncExternalStore(
    subscribeSavedChats,
    getSavedChatsSnapshot,
    () => SAVED_CHATS_SERVER_SNAPSHOT,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <main className="flex-1 pt-14">
        <div className="mx-auto w-full max-w-md px-4">
          <h1 className="py-5 text-lg font-semibold tracking-tight text-zinc-50">
            Conversations
          </h1>

          {conversations.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">
                No saved conversations yet.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="-mx-4 px-4">
              {conversations.map((conversation) => (
                <ConversationListRow
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
