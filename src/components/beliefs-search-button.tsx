"use client";

import { useGlobalSearch } from "./global-search-provider";

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

export function BeliefsSearchButton() {
  const { openSearch } = useGlobalSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className="mb-5 flex min-h-11 w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-900/[0.03] px-4 text-left text-base text-zinc-500 transition-colors active:bg-zinc-900/[0.06] dark:border-white/10 dark:bg-white/[0.03] dark:active:bg-white/[0.06]"
    >
      <SearchIcon className="size-[18px] shrink-0" />
      <span>Search beliefs...</span>
    </button>
  );
}
