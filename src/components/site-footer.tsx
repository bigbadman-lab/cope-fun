"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_LINKS = [
  { href: "/beliefs", label: "Beliefs" },
  { href: "/agents", label: "Agents" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Legal" },
] as const;

export function SiteFooter() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isRoomPage = pathname.startsWith("/room");

  if (isRoomPage) {
    return null;
  }

  return (
    <footer
      className={`border-t border-zinc-200/80 px-4 py-6 dark:border-white/5 ${
        isHomepage
          ? "lg:pointer-events-auto lg:fixed lg:bottom-0 lg:left-0 lg:right-0 lg:z-40 lg:flex lg:h-12 lg:items-center lg:bg-background/80 lg:py-0 lg:backdrop-blur"
          : ""
      }`}
    >
      <nav className="mx-auto flex w-full max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
