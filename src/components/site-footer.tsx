import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/conversations", label: "Conversations" },
  { href: "/agents", label: "Agents" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Legal" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 px-4 py-6">
      <nav className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
