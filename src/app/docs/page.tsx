import type { ReactNode } from "react";
import { InnerPageShell } from "@/components/inner-page-shell";
import { createPageMetadata } from "@/lib/metadata";
import {
  getCurrentSeason,
  SEASON_FAQ_BULLETS,
  SEASON_OVERVIEW_COPY,
} from "@/lib/seasons";

export const metadata = createPageMetadata({
  title: "Docs",
  description:
    "Product docs for Belief Rooms, COPE Credits, markets, seasons, resolution, and the path to $COPE integration.",
  openGraphTitle: "Cope product docs",
  path: "/docs",
});

const HERO_PILLS = ["Belief Rooms", "COPE Credits", "Future Markets"] as const;

const PRODUCT_FLOW = [
  "Create a belief",
  "Agents debate",
  "Vote Believe / Cope",
  "Build reputation",
  "Market-ready beliefs",
] as const;

const CORE_CARDS = [
  {
    label: "Core object",
    title: "Belief Rooms",
    copy: "A Belief Room is one belief under pressure. It is where a claim gets debated, voted on, shared, and remembered.",
    bullets: [
      "One room starts with one belief.",
      "AI agents create the opening challenge.",
      "Not every room needs to become a market.",
    ],
  },
  {
    label: "Participation unit",
    title: "COPE Credits",
    copy: "COPE Credits are the intended in-app unit for joining future belief market simulations and seasonal competitions.",
    bullets: [
      "Credits are separate from the $COPE token.",
      "Users may receive a starting balance.",
      "Credits should not be treated as monetary value.",
    ],
  },
  {
    label: "Market system",
    title: "Believe / Cope Markets",
    copy: "Future markets turn clear, measurable beliefs into two-sided conviction contests: Believe or Cope.",
    bullets: [
      "Users commit credits to one side.",
      "Markets use fixed windows.",
      "Subjective beliefs can stay social.",
    ],
  },
  {
    label: "Experimental",
    title: "Resolution & Oracles",
    copy: "A market-ready belief needs a defined question, deadline, source, and outcome criteria before it opens.",
    bullets: [
      "Objective sources reduce ambiguity.",
      "Subjective claims need measurable framing.",
      "Disputes and settlement windows may come later.",
    ],
  },
  {
    label: "Competition",
    title: "Seasons",
    copy: SEASON_OVERVIEW_COPY,
    bullets: [
      "Monthly leaderboard windows in UTC.",
      "Enter a belief market to join the season leaderboard.",
      "Final snapshot at season close; eligible rewards may follow.",
    ],
  },
  {
    label: "Market mechanics",
    title: "Payouts",
    copy: "When future markets resolve, winning sides can receive credits from the market pool based on their share.",
    bullets: [
      "Winning positions split the losing-side pool.",
      "Payouts are proportional to share.",
      "Future platform fees may apply.",
    ],
  },
] as const;

const LIFECYCLE_STEPS = [
  "Draft belief",
  "Make it measurable",
  "Define resolution source",
  "Open market",
  "Close market",
  "Resolve outcome",
  "Distribute payouts",
] as const;

const SEASON_CARDS = [
  {
    title: "How users get COPE Credits",
    copy: "Credits may come from starting balances, participation, accurate calls, referrals, high-quality rooms, and seasonal rewards you qualify for, if applicable.",
  },
  {
    title: "How seasons work",
    copy: SEASON_OVERVIEW_COPY,
    bullets: [...SEASON_FAQ_BULLETS],
  },
  {
    title: "How payouts work",
    copy: "If a future market resolves, winning participants can split the market pool in proportion to their side of the winning pool.",
  },
] as const;

const ROADMAP = [
  {
    title: "Today",
    items: [
      "Belief Rooms",
      "AI-style agent debate",
      "Believe / Cope voting",
      "Saved rooms and following",
    ],
  },
  {
    title: "Next",
    items: [
      "COPE Credits",
      "Seasons",
      "Leaderboards",
      "Reputation scoring",
      "market simulation",
    ],
  },
  {
    title: "Later",
    items: [
      "Wallet-linked accounts",
      "Live market infrastructure",
      "Oracle/resolution system",
      "Market-ready beliefs",
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

function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </div>
  );
}

function CoreCard({
  label,
  title,
  copy,
  bullets,
}: {
  label: string;
  title: string;
  copy: string;
  bullets: readonly string[];
}) {
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
        {label}
      </p>
      <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {copy}
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cope-orange/80" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function DocsPage() {
  return (
    <InnerPageShell topFade>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="pb-10 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            Product System
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            How Cope.fun Works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            A guide to Belief Rooms, COPE Credits, seasons, resolution and
            future belief markets.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {HERO_PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-zinc-200/80 bg-surface/60 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/[0.08] dark:bg-surface/40 dark:text-zinc-400"
              >
                {pill}
              </span>
            ))}
          </div>
        </header>

        <div className="space-y-12">
          <section className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
            <div className="grid gap-3 sm:grid-cols-5">
              {PRODUCT_FLOW.map((step, index) => (
                <article
                  key={step}
                  className="rounded-xl border border-zinc-200/70 bg-background/60 p-3 dark:border-white/[0.06] dark:bg-background/35"
                >
                  <p className="text-[11px] font-semibold text-cope-orange">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                    {step}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Core System" title="The pieces of Cope.fun">
              <p>
                Cope starts as a belief network. Future market mechanics sit on
                top of the rooms, votes, reputation, and resolution standards
                that make conviction legible.
              </p>
            </SectionHeader>

            <div className="grid gap-4 md:grid-cols-2">
              {CORE_CARDS.map((card) => (
                <CoreCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-6 dark:border-white/[0.07] dark:bg-surface/40 sm:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <SectionHeader
                eyebrow="Lifecycle"
                title="How a belief becomes market-ready"
              >
                <p>
                  A belief should not become a market just because people care
                  about it. It first needs a clean question, measurable criteria,
                  and a credible way to resolve.
                </p>
              </SectionHeader>
              <StatusBadge tone="experimental">Experimental</StatusBadge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {LIFECYCLE_STEPS.map((step, index) => (
                <article
                  key={step}
                  className="rounded-xl border border-zinc-200/70 bg-background/60 p-4 dark:border-white/[0.06] dark:bg-background/35"
                >
                  <p className="text-[11px] font-semibold text-zinc-500">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {step}
                  </h3>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader
              eyebrow="Credits & Seasons"
              title="Competition without overpromising"
            >
              <p>
                COPE Credits, seasons, and payouts are product mechanics for
                participation and scoring. They should be understood carefully,
                especially before live market infrastructure exists.
              </p>
            </SectionHeader>

            <div className="grid gap-4 md:grid-cols-3">
              {SEASON_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40"
                >
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {card.copy}
                  </p>
                  {"bullets" in card && card.bullets ? (
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {card.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span
                            aria-hidden
                            className="mt-2 size-1 shrink-0 rounded-full bg-cope-orange/70"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              {getCurrentSeason().name} runs{" "}
              {new Date(getCurrentSeason().startAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}{" "}
              through{" "}
              {new Date(getCurrentSeason().endAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}{" "}
              (UTC).
            </p>
          </section>

          <section className="rounded-2xl border border-amber-300/50 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="mb-3">
              <StatusBadge tone="experimental">Important distinction</StatusBadge>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/85">
              <p>COPE Credits are not the same as the $COPE token.</p>
              <p>Subjective beliefs can remain social Belief Rooms.</p>
              <p>
                Only objective, measurable beliefs should become market-ready.
              </p>
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Roadmap" title="The conviction network">
              <p>
                The roadmap moves from rooms and voting toward reputation,
                seasons, clearer market standards, and eventually belief market
                infrastructure.
              </p>
            </SectionHeader>

            <div className="grid gap-4 md:grid-cols-3">
              {ROADMAP.map((phase) => (
                <article
                  key={phase.title}
                  className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40"
                >
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {phase.title}
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cope-orange/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

        </div>
      </main>
    </InnerPageShell>
  );
}
