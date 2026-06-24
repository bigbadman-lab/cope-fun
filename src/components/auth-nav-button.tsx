"use client";

import { useAppAuth } from "@/hooks/use-app-auth";
import {
  navIconActiveClass,
  navIconButtonClass,
  navIconClass,
} from "./theme-toggle";

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

export function AuthNavButton() {
  const { ready, authenticated, displayLabel, login, logout } = useAppAuth();

  if (!ready) {
    return (
      <span
        className={`${navIconButtonClass} opacity-40`}
        aria-hidden
      >
        <WalletIcon className={navIconClass} />
      </span>
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-1">
        <span className="hidden max-w-[7rem] truncate text-[11px] font-medium text-zinc-500 sm:inline">
          {displayLabel}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Sign out"
          className={`${navIconButtonClass} ${navIconActiveClass}`}
        >
          <WalletIcon className={navIconClass} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => login()}
      aria-label="Sign in"
      className={`${navIconButtonClass} group relative hover:text-cope-orange dark:hover:text-cope-orange`}
    >
      <WalletIcon
        className={`${navIconClass} transition-transform duration-200 ease-out group-hover:scale-105`}
      />
      <span
        aria-hidden
        className="absolute top-2 right-2 size-1.5 rounded-full bg-cope-orange opacity-80 transition-[transform,opacity] duration-300 group-hover:scale-125 group-hover:opacity-100"
      />
    </button>
  );
}
