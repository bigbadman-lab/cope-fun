"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGlobalSearch } from "./global-search-provider";
import { RoomShareButton } from "./room-share-button";
import { ThemeToggle, iconButtonClass } from "./theme-toggle";

type TopNavProps = {
  onLogoClick?: () => void;
};

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

function WalletIcon({ className }: { className?: string }) {
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
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1.5H6.5A2.5 2.5 0 0 0 4 11v6.5A2.5 2.5 0 0 0 6.5 20H20a2 2 0 0 0 2-2v-1.5H6.5A2.5 2.5 0 0 1 4 15V7.5Z" />
      <path d="M17 13.25h3" />
    </svg>
  );
}

export function TopNav({ onLogoClick }: TopNavProps) {
  const { openSearch } = useGlobalSearch();
  const pathname = usePathname();
  const roomSlug = pathname.startsWith("/room/")
    ? pathname.slice("/room/".length).split("/")[0]
    : null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200/80 bg-background/85 backdrop-blur-md dark:border-white/5 dark:bg-background/80">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          onClick={onLogoClick}
          className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
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
        <div className="flex items-center gap-2">
          <Link
            href="/about"
            className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            About
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search beliefs"
            className={`${iconButtonClass} h-9 gap-1.5 px-2.5 sm:px-3`}
          >
            <SearchIcon className="size-4" />
            <kbd className="hidden rounded border border-zinc-200 px-1 py-0.5 text-[10px] text-zinc-500 sm:inline dark:border-white/10 dark:text-zinc-500">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            disabled
            aria-label="Connect wallet"
            className={`${iconButtonClass} size-9`}
          >
            <WalletIcon className="size-4" />
          </button>
          {roomSlug && <RoomShareButton slug={roomSlug} />}
        </div>
      </div>
    </header>
  );
}
