"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHomepageFooterInFlow } from "./homepage-footer-context";

const FOOTER_COLUMNS = [
  {
    title: "Learn",
    links: [
      { href: "/about", label: "About" },
      { href: "/manifesto", label: "Manifesto" },
      { href: "/agents", label: "Agents" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/cope", label: "$COPE" },
      { href: "/docs", label: "Docs" },
      { href: "/how-markets-work", label: "Markets" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/legal", label: "Legal" },
    ],
  },
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

function FooterLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "text-xs text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={`inline-flex items-center justify-center ${className}`}
      >
        <XIcon className="size-3.5" />
      </a>
    );
  }

  return (
    <Link href={href} className={`inline-block ${className}`}>
      {label}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[4.75rem] flex-col items-center text-center sm:min-w-[5.25rem]">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">{children}</ul>
    </div>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isRoomPage = pathname.startsWith("/room");
  const homepageFooterInFlow = useHomepageFooterInFlow();

  if (isRoomPage) {
    return null;
  }

  // Homepage debate is full-viewport; hide footer so it never overlaps messages.
  if (isHomepage && !homepageFooterInFlow) {
    return null;
  }

  return (
    <footer
      className="relative z-10 hidden shrink-0 overflow-hidden border-t border-zinc-200/80 bg-background px-4 py-6 dark:border-white/5 md:flex md:flex-col md:items-center md:pt-8 md:pb-0"
    >
      <nav
        aria-label="Footer"
        className="mx-auto flex w-fit items-start justify-center gap-x-10 sm:gap-x-12"
      >
        {FOOTER_COLUMNS.map((column) => (
          <FooterColumn key={column.title} title={column.title}>
            {column.links.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href} label={link.label} />
              </li>
            ))}
            {column.title === "Legal" ? (
              <li>
                <FooterLink
                  href="https://x.com/copefun"
                  label="Cope on X"
                  external
                />
              </li>
            ) : null}
          </FooterColumn>
        ))}
      </nav>

      <div className="mt-8 w-full overflow-hidden">
        <div className="mx-auto h-[calc(min(560px,72vw)*0.92/3)] w-full max-w-[560px] overflow-hidden">
          <Image
            src="/copefooter.png"
            alt="Cope"
            width={750}
            height={250}
            className="h-auto w-full max-w-[560px] object-contain"
            draggable={false}
          />
        </div>
      </div>
    </footer>
  );
}
