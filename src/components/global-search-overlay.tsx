"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { ParticipantAvatarStack } from "./avatar-placeholder";
import { BeliefBadges } from "./belief-list-badges";
import { navIconButtonClass } from "./theme-toggle";
import {
  buildSearchIndex,
  searchConversations,
  type SearchResult,
} from "@/lib/conversation-search";
import {
  formatConversationTime,
  getSavedChatsSnapshot,
  SAVED_CHATS_SERVER_SNAPSHOT,
  subscribeSavedChats,
} from "@/lib/saved-chats";

type GlobalSearchOverlayProps = {
  onClose: () => void;
};

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6L18 18M18 6L6 18" />
    </svg>
  );
}

export function GlobalSearchOverlay({ onClose }: GlobalSearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const conversations = useSyncExternalStore(
    subscribeSavedChats,
    getSavedChatsSnapshot,
    () => SAVED_CHATS_SERVER_SNAPSHOT,
  );

  const participantsBySlug = useMemo(
    () => new Map(conversations.map((item) => [item.slug, item.participants])),
    [conversations],
  );

  const searchIndex = useMemo(
    () => buildSearchIndex(conversations),
    [conversations],
  );

  const results = useMemo(
    () => searchConversations(searchIndex, query),
    [searchIndex, query],
  );

  const trimmedQuery = query.trim();

  const openResult = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/room/${slug}`);
    },
    [onClose, router],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Enter" && results.length > 0) {
        event.preventDefault();
        openResult(results[0].slug);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, onClose, openResult]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur sm:items-start sm:justify-center sm:bg-black/55 sm:p-4 sm:pt-[12vh] sm:backdrop-blur-[2px] dark:sm:bg-black/55"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] sm:mx-auto sm:h-auto sm:max-h-[min(78dvh,640px)] sm:max-w-lg sm:flex-none sm:rounded-2xl sm:border sm:border-zinc-200 sm:bg-background sm:pb-0 sm:pt-0 sm:shadow-2xl sm:backdrop-blur-none dark:sm:border-white/10"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search beliefs"
      >
        <div className="shrink-0 border-b border-zinc-200/80 px-4 py-3 dark:border-white/5">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search beliefs, agents, markets..."
              className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-500 sm:min-h-0 sm:text-sm dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className={`${navIconButtonClass} sm:hidden`}
            >
              <CloseIcon className="size-4" />
            </button>
            <kbd className="hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline dark:border-zinc-800 dark:bg-zinc-900">
              esc
            </kbd>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:max-h-none">
          {!trimmedQuery && results.length > 0 && (
            <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
              Recent beliefs
            </p>
          )}

          {results.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-zinc-500">
              {conversations.length === 0
                ? "No saved beliefs yet."
                : trimmedQuery
                  ? "No beliefs found."
                  : "No saved beliefs yet."}
            </p>
          ) : (
            <ul>
              {results.map((result) => {
                const participants = participantsBySlug.get(result.slug) ?? [];

                return (
                  <li
                    key={result.id}
                    className="flex min-h-[64px] items-center gap-3 rounded-xl px-1 sm:min-h-0 sm:rounded-lg"
                  >
                    {participants.length > 0 && (
                      <ParticipantAvatarStack participants={participants} />
                    )}
                    <button
                      type="button"
                      onClick={() => openResult(result.slug)}
                      className="min-w-0 flex-1 rounded-xl px-2 py-3 text-left transition-colors active:bg-zinc-950/[0.05] sm:rounded-lg sm:px-2 sm:py-2.5 sm:hover:bg-zinc-950/[0.04] dark:active:bg-white/[0.05] dark:sm:hover:bg-white/[0.03]"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[15px] font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
                          {result.belief}
                        </p>
                        <span className="shrink-0 text-[11px] text-zinc-500">
                          {formatConversationTime(result.createdAt)}
                        </span>
                      </div>
                      {result.preview && (
                        <p className="mt-0.5 truncate text-sm text-zinc-500 sm:text-xs">
                          {result.preview}
                        </p>
                      )}
                      <BeliefBadges
                        hasMarket={result.hasMarket}
                        userVote={result.userVote}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
