"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getActiveMobileBottomNavItem,
  MOBILE_BOTTOM_NAV_ITEMS,
  type MobileBottomNavItemId,
} from "@/lib/mobile-bottom-nav";

function BeliefsIcon({ className }: { className?: string }) {
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
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MarketsIcon({ className }: { className?: string }) {
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
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function CreateIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function LeaderboardIcon({ className }: { className?: string }) {
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
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10l1 7H6L7 4z" />
      <path d="M9 11v3M15 11v3" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c.9-3 3.6-5 6.5-5s5.6 2 6.5 5" />
    </svg>
  );
}

const ICONS: Record<
  MobileBottomNavItemId,
  ComponentType<{ className?: string }>
> = {
  beliefs: BeliefsIcon,
  markets: MarketsIcon,
  create: CreateIcon,
  leaderboard: LeaderboardIcon,
  profile: ProfileIcon,
};

function NavItem({
  id,
  href,
  label,
  active,
  primary = false,
}: {
  id: MobileBottomNavItemId;
  href: string;
  label: string;
  active: boolean;
  primary?: boolean;
}) {
  const Icon = ICONS[id];

  if (primary) {
    return (
      <Link
        href={href}
        prefetch
        aria-current={active ? "page" : undefined}
        className="group -mt-3 flex min-h-11 min-w-11 flex-1 flex-col items-center justify-end gap-1 pb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8401]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          className={`flex size-12 items-center justify-center rounded-full border shadow-[0_8px_20px_-10px_rgb(252_132_1/0.65)] transition-[transform,background-color,border-color] duration-150 ease-out group-active:scale-95 dark:shadow-[0_8px_20px_-10px_rgb(252_132_1/0.55)] ${
            active
              ? "border-[#fc8401]/50 bg-[#fc8401] text-white"
              : "border-[#fc8401]/35 bg-[#fc8401] text-white group-hover:bg-[#fc8401]/90"
          }`}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={`text-[10px] font-semibold leading-none ${
            active ? "text-[#fc8401]" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 min-w-11 flex-1 flex-col items-center justify-end gap-1 rounded-lg pb-1.5 pt-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-zinc-500 ${
        active
          ? "text-cope-orange"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      <Icon className={`size-5 ${active ? "stroke-[2]" : ""}`} />
      <span
        className={`text-[10px] leading-none ${
          active ? "font-semibold" : "font-medium"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const activeId = getActiveMobileBottomNavItem(pathname);

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-background/82 backdrop-blur-xl md:hidden dark:border-white/[0.06] dark:bg-background/78"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex h-[var(--mobile-bottom-nav-height)] max-w-lg items-end justify-around px-1.5">
        {MOBILE_BOTTOM_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            href={item.href}
            label={item.label}
            active={activeId === item.id}
            primary={item.id === "create"}
          />
        ))}
      </div>
    </nav>
  );
}
