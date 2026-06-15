"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ConversationListRow } from "./conversation-list-row";
import { InnerPageShell } from "./inner-page-shell";
import { useGlobalSearch } from "./global-search-provider";
import {
  getSavedChatsSnapshot,
  SAVED_CHATS_SERVER_SNAPSHOT,
  subscribeSavedChats,
} from "@/lib/saved-chats";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" />
    </svg>
  );
}

export function ConversationsPage() {
  const { openSearch } = useGlobalSearch();
  const conversations = useSyncExternalStore(
    subscribeSavedChats,
    getSavedChatsSnapshot,
    () => SAVED_CHATS_SERVER_SNAPSHOT,
  );

  return (
    <InnerPageShell>
      <div className="inner-page-content w-full max-w-md !py-5">
        <h1 className="pb-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Beliefs
        </h1>

        <button
          type="button"
          onClick={openSearch}
          className="mb-5 flex min-h-11 w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-900/[0.03] px-4 text-left text-base text-zinc-500 transition-colors active:bg-zinc-900/[0.06] dark:border-white/10 dark:bg-white/[0.03] dark:active:bg-white/[0.06]"
        >
          <SearchIcon className="size-[18px] shrink-0" />
          <span>Search beliefs...</span>
        </button>

        {conversations.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base text-zinc-500">No saved beliefs yet.</p>
            <Link
              href="/"
              className="mt-4 inline-flex min-h-11 items-center text-base font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="w-full">
            {conversations.map((conversation) => (
              <ConversationListRow
                key={conversation.id}
                conversation={conversation}
              />
            ))}
          </div>
        )}
      </div>
    </InnerPageShell>
  );
}
