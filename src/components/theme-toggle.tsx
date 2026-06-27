"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const iconButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-[color,background-color,transform,box-shadow] duration-150 ease-out hover:bg-zinc-950/[0.05] hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 active:scale-95 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-500/40";

const navIconButtonClass = `${iconButtonClass} size-11 md:size-10`;

const navIconButtonPrimaryClass = `${navIconButtonClass} hover:text-cope-orange focus-visible:ring-cope-orange/25 dark:hover:text-cope-orange dark:focus-visible:ring-cope-orange/20`;

const navIconActiveClass = "text-cope-orange dark:text-cope-orange";

const navGroupDividerClass =
  "mx-1 hidden h-4 w-px shrink-0 bg-zinc-200/80 md:block dark:bg-white/10";

const navIconClass = "size-[18px]";

function SunIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
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
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className={`${navIconButtonClass}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={navIconButtonClass}
    >
      <span className={`relative block ${navIconClass}`}>
        <SunIcon
          className={`absolute inset-0 ${navIconClass} transition-all duration-200 ease-out ${
            isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-75 opacity-0"
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 ${navIconClass} transition-all duration-200 ease-out ${
            isDark ? "-rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </span>
    </button>
  );
}

export {
  iconButtonClass,
  navGroupDividerClass,
  navIconActiveClass,
  navIconButtonClass,
  navIconButtonPrimaryClass,
  navIconClass,
};
