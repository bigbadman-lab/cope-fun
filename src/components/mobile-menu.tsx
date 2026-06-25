"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthNavAffordance } from "./auth-nav-button";
import { navIconButtonClass } from "./theme-toggle";

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/beliefs", label: "Beliefs" },
  { href: "/markets", label: "Markets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/agents", label: "Agents" },
] as const;

const SECONDARY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/docs", label: "Docs" },
  { href: "/how-markets-work", label: "How Markets Work" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Legal" },
] as const;

const MENU_TRANSITION_MS = 220;

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

type MenuLink = {
  href: string;
  label: string;
};

function CloseIcon({ className }: { className?: string }) {
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
      <path d="M6 6L18 18M18 6L6 18" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.964 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuNavItem({
  link,
  pathname,
  onClose,
  size = "primary",
}: {
  link: MenuLink;
  pathname: string;
  onClose: () => void;
  size?: "primary" | "secondary";
}) {
  const active = isActivePath(pathname, link.href);
  const textSize = size === "primary" ? "text-lg" : "text-base";

  const className = [
    "flex min-h-11 w-full items-center rounded-xl px-3 font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.99]",
    textSize,
    active
      ? "bg-zinc-900/[0.07] text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-50"
      : size === "primary"
        ? "text-zinc-600 active:bg-zinc-950/[0.05] dark:text-zinc-400 dark:active:bg-white/[0.05]"
        : "text-zinc-500 active:bg-zinc-950/[0.05] dark:text-zinc-500 dark:active:bg-white/[0.05]",
  ].join(" ");

  if (active) {
    return (
      <button
        type="button"
        onClick={onClose}
        aria-current="page"
        className={className}
      >
        {link.label}
      </button>
    );
  }

  return (
    <Link href={link.href} onClick={onClose} prefetch className={className}>
      {link.label}
    </Link>
  );
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const primaryLinks: MenuLink[] = [...PRIMARY_LINKS];

  useEffect(() => {
    if (open) {
      let visibleFrame = 0;
      const frame = requestAnimationFrame(() => {
        setMounted(true);
        visibleFrame = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(visibleFrame);
      };
    }

    const frame = requestAnimationFrame(() => setVisible(false));
    const timer = window.setTimeout(() => setMounted(false), MENU_TRANSITION_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[55] flex flex-col bg-background transition-[opacity,transform] duration-[220ms] ease-out md:hidden ${
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 -translate-y-2"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      aria-hidden={!visible}
    >
      <div className="flex shrink-0 items-center justify-end px-4 py-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className={navIconButtonClass}
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-6">
        <div className="mb-4">
          <AuthNavAffordance variant="menu" onNavigate={onClose} />
        </div>

        <ul className="space-y-1">
          {primaryLinks.map((link) => (
            <li key={link.href}>
              <MenuNavItem
                link={link}
                pathname={pathname}
                onClose={onClose}
                size="primary"
              />
            </li>
          ))}
        </ul>

        <div className="my-5 h-px bg-zinc-200/80 dark:bg-white/5" />

        <ul className="space-y-1">
          {SECONDARY_LINKS.map((link) => (
            <li key={link.href}>
              <MenuNavItem
                link={link}
                pathname={pathname}
                onClose={onClose}
                size="secondary"
              />
            </li>
          ))}
          <li>
            <a
              href="https://x.com/copefun"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Cope on X"
              className="flex min-h-11 w-full items-center rounded-xl px-3 text-zinc-500 transition-colors hover:text-zinc-800 active:bg-zinc-950/[0.05] dark:text-zinc-500 dark:hover:text-zinc-300 dark:active:bg-white/[0.05]"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </a>
          </li>
        </ul>

        <div className="mt-4 flex flex-col items-start px-3 pb-2">
          <Link
            href="/"
            onClick={onClose}
            className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
          >
            <Image
              src="/logotext3.png"
              alt="cope"
              width={313}
              height={94}
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </nav>
    </div>
  );
}
