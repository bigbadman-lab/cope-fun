"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
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

function SearchBadges({ result }: { result: SearchResult }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {result.hasMarket && (
        <span className="rounded-full border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400/85">
          Market Live
        </span>
      )}
      {result.userVote === "believe" && (
        <span className="rounded-full border border-emerald-900/30 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400/70">
          Voted Believe
        </span>
      )}
      {result.userVote === "cope" && (
        <span className="rounded-full border border-rose-900/30 bg-rose-950/20 px-2 py-0.5 text-[10px] font-medium text-rose-400/70">
          Voted Cope
        </span>
      )}
    </div>
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-start sm:p-4 sm:pt-[12vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(78dvh,640px)] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-background shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search conversations"
      >
        <div className="border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search beliefs, agents, markets..."
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <kbd className="hidden rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline">
              esc
            </kbd>
          </div>
        </div>

        <div className="overflow-y-auto px-2 py-2">
          {!trimmedQuery && results.length > 0 && (
            <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
              Recent conversations
            </p>
          )}

          {results.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-zinc-500">
              {conversations.length === 0
                ? "No saved conversations yet."
                : "No matches found."}
            </p>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => openResult(result.slug)}
                    className="w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {result.belief}
                      </p>
                      <span className="shrink-0 text-[11px] text-zinc-500">
                        {formatConversationTime(result.createdAt)}
                      </span>
                    </div>
                    {result.preview && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {result.preview}
                      </p>
                    )}
                    <SearchBadges result={result} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
