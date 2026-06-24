"use client";

import Link from "next/link";
import { BeliefDirectoryRow } from "./belief-directory-row";
import { InnerPageShell } from "./inner-page-shell";
import { useGlobalSearch } from "./global-search-provider";
import type { BeliefDirectoryPage } from "@/lib/db/beliefs-directory";

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

type BeliefsDirectoryPageProps = BeliefDirectoryPage;

function DirectoryPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? `/beliefs?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `/beliefs?page=${page + 1}` : null;

  return (
    <nav
      aria-label="Beliefs pagination"
      className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200/60 pt-4 dark:border-white/[0.06]"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Previous
        </Link>
      ) : (
        <span className="inline-flex min-h-10 items-center px-3 text-sm text-zinc-400 dark:text-zinc-600">
          Previous
        </span>
      )}

      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
        Page {page} of {totalPages}
      </span>

      {nextHref ? (
        <Link
          href={nextHref}
          className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Next
        </Link>
      ) : (
        <span className="inline-flex min-h-10 items-center px-3 text-sm text-zinc-400 dark:text-zinc-600">
          Next
        </span>
      )}
    </nav>
  );
}

export function BeliefsDirectoryPage({
  items,
  page,
  totalPages,
  totalCount,
}: BeliefsDirectoryPageProps) {
  const { openSearch } = useGlobalSearch();

  return (
    <InnerPageShell topFade>
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

        {totalCount === 0 ? (
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
          <>
            <div className="w-full">
              {items.map((item) => (
                <BeliefDirectoryRow key={item.id} item={item} />
              ))}
            </div>
            <DirectoryPagination page={page} totalPages={totalPages} />
          </>
        )}
      </div>
    </InnerPageShell>
  );
}
