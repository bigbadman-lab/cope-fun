"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useGlobalSearch } from "./global-search-provider";
import { MobileMenu } from "./mobile-menu";
import { RoomShareButton } from "./room-share-button";
import { ThemeToggle, navIconButtonClass, navIconClass } from "./theme-toggle";

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

function MenuIcon({ className }: { className?: string }) {
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
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function TopNav({ onLogoClick }: TopNavProps) {
  const { openSearch } = useGlobalSearch();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const roomSlug = pathname.startsWith("/room/")
    ? pathname.slice("/room/".length).split("/")[0]
    : null;

  const handleOpenSearch = useCallback(() => {
    setMenuOpen(false);
    openSearch();
  }, [openSearch]);

  const handleLogoClick = useCallback(() => {
    setMenuOpen(false);
    onLogoClick?.();
  }, [onLogoClick]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200/80 bg-background pt-[env(safe-area-inset-top,0px)] backdrop-blur-md dark:border-white/5 dark:bg-background dark:backdrop-blur-none">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
          >
            <Image
              src="/logotext.png"
              alt="cope"
              width={313}
              height={94}
              className="h-7 w-auto sm:h-8"
              priority
            />
          </Link>

          <div className="flex items-center gap-1.5">
            <Link
              href="/about"
              className="hidden text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 md:inline dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              About
            </Link>

            <button
              type="button"
              onClick={handleOpenSearch}
              aria-label="Search beliefs"
              className={navIconButtonClass}
            >
              <SearchIcon className={navIconClass} />
            </button>

            <ThemeToggle />

            <button
              type="button"
              disabled
              aria-label="Connect wallet"
              className={navIconButtonClass}
            >
              <WalletIcon className={navIconClass} />
            </button>

            {roomSlug && <RoomShareButton slug={roomSlug} />}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={`${navIconButtonClass} md:hidden`}
            >
              <MenuIcon className={navIconClass} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
