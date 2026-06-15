"use client";

import Image from "next/image";
import Link from "next/link";
import { useGlobalSearch } from "./global-search-provider";

type TopNavProps = {
  onLogoClick?: () => void;
};

export function TopNav({ onLogoClick }: TopNavProps) {
  const { openSearch } = useGlobalSearch();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          onClick={onLogoClick}
          className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <Image
            src="/logotext.png"
            alt="cope"
            width={313}
            height={94}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/about"
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            About
          </Link>
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search conversations"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 sm:px-3"
          >
            Search
            <kbd className="hidden rounded border border-zinc-800 px-1 py-0.5 text-[10px] text-zinc-600 sm:inline">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 sm:px-4"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
}
