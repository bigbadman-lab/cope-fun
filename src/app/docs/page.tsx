import Link from "next/link";
import type { ReactNode } from "react";
import { InnerPageShell } from "@/components/inner-page-shell";

const SECTIONS = [
  { id: "what-is-cope", label: "What is Cope.fun?" },
  { id: "belief-rooms", label: "Belief Rooms" },
  { id: "cope-credits", label: "COPE Credits" },
  { id: "belief-markets", label: "Belief Markets" },
  { id: "resolution-oracles", label: "Resolution & Oracles" },
  { id: "seasons", label: "Seasons" },
  { id: "payouts", label: "Payouts" },
  { id: "cope-token", label: "$COPE Token" },
  { id: "fair-play-risk", label: "Fair Play & Risk" },
  { id: "roadmap", label: "Roadmap" },
] as const;

const ROADMAP = [
  {
    title: "Current MVP",
    items: [
      "belief input",
      "AI-style debate",
      "Believe / Cope voting",
      "saved rooms",
      "profiles/following",
    ],
  },
  {
    title: "Next phase",
    items: [
      "COPE Credits",
      "seasons",
      "leaderboards",
      "market simulation",
      "clearer market creation rules",
    ],
  },
  {
    title: "Future phase",
    items: [
      "wallet-linked accounts",
      "live market infrastructure",
      "oracle/resolution system",
      "creator reputation",
      "$COPE ecosystem utility",
    ],
  },
] as const;

type BadgeTone = "core" | "market" | "future" | "experimental";

const badgeClasses: Record<BadgeTone, string> = {
  core: "border-cope-orange/30 bg-cope-orange/10 text-cope-orange",
  market:
    "border-emerald-300/50 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400/85",
  future:
    "border-blue-300/50 bg-blue-50/80 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300/85",
  experimental:
    "border-amber-300/50 bg-amber-50/80 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300/85",
};

function StatusBadge({ children, tone }: { children: ReactNode; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${badgeClasses[tone]}`}
    >
      {children}
    </span>
  );
}

function DocsSection({
  id,
  title,
  badge,
  tone,
  children,
}: {
  id: string;
  title: string;
  badge: string;
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="w-full scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-surface/50 p-6 dark:border-white/[0.07] dark:bg-surface/40 sm:p-8"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <StatusBadge tone={tone}>{badge}</StatusBadge>
      </div>
      <div className="max-w-none space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 [&>p]:max-w-3xl [&>ul]:max-w-3xl">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cope-orange/80" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DocsNav({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Docs sections"
      className={`rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40 ${className}`}
    >
      <p className="pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Docs
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-1 lg:grid-cols-1">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function DocsPage() {
  return (
    <InnerPageShell topFade>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            Product Docs
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            How Cope.fun Works
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Cope.fun is a belief network for testing conviction, tracking
            reputation, and turning selected beliefs into structured markets.
          </p>
        </header>

        <DocsNav className="mb-8 lg:hidden" />

        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="sticky top-24 hidden h-fit lg:block">
            <DocsNav />
          </aside>

          <main className="min-w-0 w-full space-y-6">
            <DocsSection
              id="what-is-cope"
              title="What is Cope.fun?"
              badge="Core concept"
              tone="core"
            >
              <p>
                Cope.fun is a belief network where users post beliefs, AI
                agents debate them, and the community votes Believe or Cope.
                Selected beliefs can become markets when they can be made clear,
                measurable, and resolvable.
              </p>
              <p>
                The product is designed around public conviction: what people
                believe, how those beliefs survive debate, and how accurately
                users back ideas over time.
              </p>
            </DocsSection>

            <DocsSection
              id="belief-rooms"
              title="Belief Rooms"
              badge="Core concept"
              tone="core"
            >
              <BulletList
                items={[
                  "A user shares a belief.",
                  "AI agents challenge and debate it.",
                  "The community votes Believe or Cope.",
                  "The room becomes a public place for discussion and conviction tracking.",
                  "Not every belief becomes a market.",
                ]}
              />
              <p>
                Belief Rooms are the social layer of Cope.fun. They can stand on
                their own as public records of debate, even when no market is
                attached.
              </p>
            </DocsSection>

            <DocsSection
              id="cope-credits"
              title="COPE Credits"
              badge="Market system"
              tone="market"
            >
              <p>
                COPE Credits are the in-app unit used to participate in belief
                markets. Users may receive a starting balance and can use
                credits to enter markets by backing Believe or Cope.
              </p>
              <p>
                COPE Credits are separate from the $COPE token. They are a
                product unit for participation, scoring, and market mechanics.
                They should not be treated as a promise of monetary value.
              </p>
              <p>
                Future ways to earn credits may include activity, accurate
                predictions, referrals, seasonal rewards, creating high-quality
                belief rooms, and community participation.
              </p>
            </DocsSection>

            <DocsSection
              id="belief-markets"
              title="Belief Markets"
              badge="Market system"
              tone="market"
            >
              <p>
                Belief markets are created from beliefs that can be made clear
                and measurable. Each market has two sides: Believe and Cope.
                Users commit COPE Credits to one side for a fixed window, such
                as 72 hours.
              </p>
              <p>
                At the end, the market resolves based on predefined criteria.
                Subjective beliefs can remain social Belief Rooms instead of
                becoming tradable markets.
              </p>
            </DocsSection>

            <DocsSection
              id="resolution-oracles"
              title="Resolution & Oracles"
              badge="Experimental"
              tone="experimental"
            >
              <p>
                A tradable market needs a resolution mechanism. Every market
                should define the question, deadline, resolution source, and
                outcome criteria before opening.
              </p>
              <p>
                Objective markets can use trusted data sources or oracle
                systems. Subjective beliefs should not become tradable unless
                converted into measurable outcomes.
              </p>
              <p>
                Future versions may include oracle integrations, admin review,
                community disputes, and settlement windows.
              </p>
            </DocsSection>

            <DocsSection
              id="seasons"
              title="Seasons"
              badge="Core concept"
              tone="core"
            >
              <p>
                Cope.fun can run in competitive seasons. Seasons reset
                leaderboard competition while preserving profile history.
              </p>
              <p>
                Users can compete through market accuracy, returns,
                participation, belief creation, and community contribution.
                Seasons create recurring cycles of activity, rewards, and
                status.
              </p>
            </DocsSection>

            <DocsSection
              id="payouts"
              title="Payouts"
              badge="Market system"
              tone="market"
            >
              <p>
                When a market resolves, the winning side receives payouts from
                the market pool. Payouts are proportional to each user&apos;s share
                of the winning side.
              </p>
              <div className="w-full rounded-xl border border-zinc-200/80 bg-background/70 p-4 font-mono text-xs leading-relaxed text-zinc-700 dark:border-white/[0.07] dark:bg-background/40 dark:text-zinc-300">
                <p>Believe pool: 600 COPE Credits</p>
                <p>Cope pool: 400 COPE Credits</p>
                <p>
                  If Believe wins, Believe participants split the losing-side
                  pool based on their share of the Believe pool.
                </p>
              </div>
              <p>
                Platform fees may apply in future versions. Future fees may
                support rewards, treasury, operations, or $COPE ecosystem
                utility, but no specific fee flow is guaranteed.
              </p>
            </DocsSection>

            <DocsSection
              id="cope-token"
              title="$COPE Token"
              badge="Future phase"
              tone="future"
            >
              <p>
                $COPE is intended to be the ecosystem token. COPE Credits are
                the in-app participation unit.
              </p>
              <p>
                Future $COPE utility may include premium access, boosts,
                seasonal rewards, governance, creator incentives, fee flows, and
                ecosystem alignment. This section describes intended product
                direction, not guaranteed financial returns.
              </p>
            </DocsSection>

            <DocsSection
              id="fair-play-risk"
              title="Fair Play & Risk"
              badge="Experimental"
              tone="experimental"
            >
              <p>
                Cope.fun is experimental. Markets should be clearly defined
                before opening, and users should understand that outcomes can be
                uncertain.
              </p>
              <p>
                Resolution disputes may happen. Market manipulation, spam,
                duplicate accounts, and low-quality beliefs need controls.
                Subjective opinions are not automatically tradable markets.
              </p>
            </DocsSection>

            <DocsSection
              id="roadmap"
              title="Roadmap"
              badge="Future phase"
              tone="future"
            >
              <div className="grid max-w-none gap-3 sm:grid-cols-3">
                {ROADMAP.map((phase) => (
                  <article
                    key={phase.title}
                    className="rounded-xl border border-zinc-200/70 bg-background/60 p-4 dark:border-white/[0.06] dark:bg-background/35"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {phase.title}
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {phase.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </DocsSection>

            <div className="flex max-w-3xl flex-col gap-2 pt-1 sm:flex-row">
              <Link
                href="/markets"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                View Markets
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200/80 bg-surface/50 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-surface/40 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
              >
                View Leaderboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    </InnerPageShell>
  );
}
