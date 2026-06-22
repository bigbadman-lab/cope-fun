"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useWalletSession } from "@/lib/wallet-session";
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
  const wallet = useWalletSession();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const primaryLinks: MenuLink[] = wallet.connected
    ? [{ href: "/profile", label: "Profile" }, ...PRIMARY_LINKS]
    : [...PRIMARY_LINKS];

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
        </ul>

        <div className="mt-8 px-3 pb-2">
          <Link
            href="/"
            onClick={onClose}
            className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
          >
            <Image
              src="/logotext.png"
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
