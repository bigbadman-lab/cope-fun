"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHomepageFooterInFlow } from "./homepage-footer-context";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/agents", label: "Agents" },
  { href: "/how-markets-work", label: "How Markets Work" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Legal" },
] as const;

export function SiteFooter() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isRoomPage = pathname.startsWith("/room");
  const homepageFooterInFlow = useHomepageFooterInFlow();
  const useFixedHomeFooter = isHomepage && !homepageFooterInFlow;

  if (isRoomPage) {
    return null;
  }

  return (
    <footer
      className={`hidden shrink-0 border-t border-zinc-200/80 bg-background px-4 py-6 dark:border-white/5 md:block ${
        useFixedHomeFooter
          ? "lg:pointer-events-auto lg:fixed lg:bottom-0 lg:left-0 lg:right-0 lg:z-40 lg:flex lg:h-12 lg:items-center lg:bg-background lg:py-0"
          : "lg:flex lg:h-12 lg:items-center lg:py-0"
      }`}
    >
      <nav className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-4 gap-y-2">
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
