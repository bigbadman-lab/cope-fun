"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHomepageFooterInFlow } from "./homepage-footer-context";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/agents", label: "Agents" },
  { href: "/docs", label: "Docs" },
  { href: "/how-markets-work", label: "How Markets Work" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Legal" },
] as const;

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
      className={`relative z-10 hidden shrink-0 border-t border-zinc-200/80 bg-background px-4 py-6 dark:border-white/5 md:block ${
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
        <a
          href="https://x.com/copefun"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cope on X"
          className="inline-flex items-center text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          <XIcon className="size-3.5" />
        </a>
      </nav>
    </footer>
  );
}
