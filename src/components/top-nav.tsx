"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AuthNavButton } from "./auth-nav-button";
import { useGlobalSearch } from "./global-search-provider";
import { MobileMenu } from "./mobile-menu";
import { RoomFollowButton } from "./room-follow-button";
import { RoomShareButton } from "./room-share-button";
import {
  getSavedConversationSnapshotBySlug,
  SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT,
  subscribeSavedChats,
} from "@/lib/saved-chats";
import {
  navGroupDividerClass,
  navIconButtonClass,
  navIconButtonPrimaryClass,
  navIconClass,
} from "./theme-toggle";

type TopNavProps = {
  onLogoClick?: () => void;
};

const PRODUCT_LINKS = [
  { href: "/beliefs", label: "Beliefs" },
  { href: "/markets", label: "Markets" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

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

function isActiveProductPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ProductNavLinks({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Product"
      className="hidden items-center gap-1 rounded-xl border border-zinc-200/60 bg-background/55 px-1 py-1 backdrop-blur-sm md:flex dark:border-white/[0.06] dark:bg-background/35"
    >
      {PRODUCT_LINKS.map((link) => {
        const active = isActiveProductPath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/[0.07] dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopNav({ onLogoClick }: TopNavProps) {
  const { openSearch } = useGlobalSearch();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchPressed, setSearchPressed] = useState(false);
  const roomSlug = pathname.startsWith("/room/")
    ? pathname.slice("/room/".length).split("/")[0]
    : null;

  const getRoomSnapshot = useCallback(
    () =>
      roomSlug
        ? getSavedConversationSnapshotBySlug(roomSlug)
        : SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT,
    [roomSlug],
  );

  const roomConversation = useSyncExternalStore(
    subscribeSavedChats,
    getRoomSnapshot,
    () => SAVED_CONVERSATION_NOT_FOUND_SNAPSHOT,
  );

  const roomBelief = roomConversation?.belief ?? "Unknown belief";
  const roomId = roomConversation?.id ?? null;

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
    const frame = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-transparent pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="justify-self-start rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
          >
            <Image
              src="/hoodlogo2.png"
              alt="Hoodswarm"
              width={522}
              height={178}
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>

          <ProductNavLinks pathname={pathname} />

          <div className="flex items-center gap-0.5 justify-self-end">
            <div className="flex items-center gap-0.5">
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

            <div className={navGroupDividerClass} aria-hidden />

            <AuthNavButton />
            {roomSlug && (
              <RoomFollowButton
                slug={roomSlug}
                roomId={roomId}
                belief={roomBelief}
              />
            )}
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
