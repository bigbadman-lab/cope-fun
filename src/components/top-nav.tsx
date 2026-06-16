"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useGlobalSearch } from "./global-search-provider";
import { MobileMenu } from "./mobile-menu";
import { RoomShareButton } from "./room-share-button";
import {
  ThemeToggle,
  navGroupDividerClass,
  navIconActiveClass,
  navIconButtonClass,
  navIconButtonPrimaryClass,
  navIconClass,
} from "./theme-toggle";

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
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
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
      <path d="M4 8.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5" />
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v2.5H6.5A2.5 2.5 0 0 0 4 13v-4.5Z" />
      <path d="M17 14.25h2.5" />
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

const WALLET_CONNECT_MS = 1200;

function WalletNavButton() {
  const [connecting, setConnecting] = useState(false);

  const handleClick = useCallback(() => {
    if (connecting) return;

    setConnecting(true);
    window.setTimeout(() => setConnecting(false), WALLET_CONNECT_MS);
  }, [connecting]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Connect wallet"
      aria-busy={connecting}
      className={`${navIconButtonClass} group relative hover:text-cope-orange dark:hover:text-cope-orange ${
        connecting ? navIconActiveClass : ""
      }`}
    >
      <WalletIcon
        className={`${navIconClass} transition-transform duration-200 ease-out group-hover:scale-105 ${
          connecting ? "scale-95 animate-pulse" : ""
        }`}
      />
      <span
        aria-hidden
        className={`absolute top-2 right-2 size-1.5 rounded-full bg-cope-orange transition-[transform,opacity] duration-300 ${
          connecting
            ? "scale-150 animate-ping opacity-100"
            : "animate-wallet-ready opacity-80 group-hover:scale-125 group-hover:opacity-100"
        }`}
      />
    </button>
  );
}

function isAboutPath(pathname: string) {
  return pathname === "/about" || pathname.startsWith("/about/");
}

export function TopNav({ onLogoClick }: TopNavProps) {
  const { openSearch } = useGlobalSearch();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchPressed, setSearchPressed] = useState(false);
  const roomSlug = pathname.startsWith("/room/")
    ? pathname.slice("/room/".length).split("/")[0]
    : null;
  const aboutActive = isAboutPath(pathname);

  const handleOpenSearch = useCallback(() => {
    setMenuOpen(false);
    setSearchPressed(true);
    openSearch();
    window.setTimeout(() => setSearchPressed(false), 180);
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

          <div className="flex items-center gap-0.5">
            <div className="flex items-center gap-0.5">
              <Link
                href="/about"
                aria-label="About"
                aria-current={aboutActive ? "page" : undefined}
                className={`${navIconButtonClass} hidden md:inline-flex ${
                  aboutActive ? navIconActiveClass : ""
                }`}
              >
                <InfoIcon className={navIconClass} />
              </Link>

              <button
                type="button"
                onClick={handleOpenSearch}
                aria-label="Search beliefs"
                className={navIconButtonPrimaryClass}
              >
                <SearchIcon
                  className={`${navIconClass} transition-transform duration-150 ease-out ${
                    searchPressed ? "scale-90" : "scale-100"
                  }`}
                />
              </button>
            </div>

            <div
              className={navGroupDividerClass}
              aria-hidden
            />

            <ThemeToggle />
            <WalletNavButton />
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
