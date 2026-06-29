import type { ReactNode } from "react";
import Link from "next/link";
import { InnerPageShell } from "@/components/inner-page-shell";
import { createPageMetadata } from "@/lib/metadata";
import {
  getCurrentSeason,
  SEASON_FAQ_BULLETS,
  SEASON_LEADERBOARD_QUALIFICATION_COPY,
  SEASON_LEADERBOARD_RANKING_COPY,
  SEASON_OVERVIEW_COPY,
  SEASON_REWARDS_COPY,
  SEASON_SNAPSHOT_COPY,
} from "@/lib/seasons";

export const metadata = createPageMetadata({
  title: "Docs",
  description:
    "Product docs for Belief Rooms, COPE Credits, markets, seasons, resolution, and the path to $COPE integration.",
  openGraphTitle: "Cope product docs",
  path: "/docs",
});

const HERO_PILLS = [
  "Belief Rooms",
  "COPE Credits",
  "Season Markets",
  "$COPE",
] as const;

const COPE_LOOP = [
  "Belief",
  "AI debate",
  "Community vote",
  "Team selection",
  "Season market",
  "Resolution",
  "Leaderboard",
] as const;

const AGENT_ROSTER = [
  { name: "Mason", role: "Opportunist — spots upside and second-order effects early." },
  { name: "Victor", role: "Contrarian — stress-tests consensus and weak premises." },
  { name: "Logan", role: "Builder — grounds ideas in execution and real users." },
  { name: "Theo", role: "Analyst — turns conviction into evidence and probability." },
] as const;

const NOT_LIVE_YET = [
  "Permissionless market creation",
  "Direct $COPE staking in markets",
  "On-chain market settlement",
  "Holder rewards",
  "Full $COPE integration into the market layer",
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

function DocCard({
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

function DocLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
    >
      {children}
    </Link>
  );
}

export default function DocsPage() {
  const currentSeason = getCurrentSeason();

  return (
    <InnerPageShell topFade>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="pb-10 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            Product reference
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Docs
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            A product reference for Belief Rooms, AI agents, Season markets,
            COPE Credits, and the path to $COPE integration.
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
          <section className="space-y-5">
            <SectionHeader eyebrow="Overview" title="The Cope loop">
              <p>
                Cope starts with a belief. AI agents pressure-test it. The
                community votes Believe or Cope. Selected Belief Rooms can become
                Season markets. Users enter markets with COPE Credits and compete
                on the leaderboard.
              </p>
            </SectionHeader>

            <div className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {COPE_LOOP.map((step, index) => (
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
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Belief layer" title="Belief Rooms">
              <p>
                A Belief Room is the public page where one belief is tested — not
                a chat room. It is a record of the belief under pressure.
              </p>
            </SectionHeader>

            <DocCard
              label="Core object"
              title="Belief Rooms"
              copy="One belief creates one Belief Room. AI agents debate the belief from different angles, visitors vote Believe or Cope, and the room becomes a shared record of the conviction being tested."
              bullets={[
                "One room starts with one belief.",
                "AI agents create the opening challenge.",
                "The creator can challenge the belief further when Attention is available.",
                "Not every Belief Room becomes a Season market.",
              ]}
            />
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Belief layer" title="AI agents">
              <p>
                Mason, Victor, Logan, and Theo are AI agents with different
                reasoning styles. They do not provide final truth. Their job is to
                pressure-test assumptions so the belief is easier to judge.
              </p>
            </SectionHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              {AGENT_ROSTER.map((agent) => (
                <article
                  key={agent.name}
                  className="rounded-xl border border-zinc-200/70 bg-background/60 p-4 dark:border-white/[0.06] dark:bg-background/35"
                >
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {agent.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {agent.role}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Market layer" title="Season markets">
              <p>
                Season markets are curated by the Cope team during the MVP. Users
                cannot create markets directly yet. Selected Belief Rooms become
                markets with Believe and Cope sides, close windows, and written
                resolution criteria.
              </p>
            </SectionHeader>

            <DocCard
              label="Market system"
              title="Believe / Cope markets"
              copy="Each Season market turns a clear, measurable belief into a two-sided conviction contest. Objective resolution criteria matter before a market opens."
              bullets={[
                "Markets are team-curated during the MVP.",
                "Users commit COPE Credits to Believe or Cope.",
                "Each market has close and resolution criteria.",
                "Subjective beliefs can remain social Belief Rooms only.",
              ]}
            />
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Room types" title="Pulse Rooms">
              <p>
                Most rooms are standard Belief Rooms built around debate. Pulse
                Rooms are a newer room type centred on a live data feed instead
                of AI agents — open community chat alongside a live Pulse market.
              </p>
            </SectionHeader>

            <DocCard
              label="Live markets"
              title="Pulse markets"
              copy="A Pulse market is built from a real-time data feed. It opens, locks, and settles automatically in continuous rounds, with outcomes determined by live price movement. Pulse currently tracks SOL/USD."
              bullets={[
                "No AI debate — Pulse Rooms run on live data and community chat.",
                "Rounds open, lock, and settle automatically.",
                "Outcomes come from live price movement, not team resolution.",
                "Participation uses COPE Credits, the same as other markets.",
              ]}
            />
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Market layer" title="COPE Credits">
              <p>
                COPE Credits are gameplay credits used during Seasons 1–3. They
                let users enter markets while Cope tests mechanics before deeper
                token integration.
              </p>
            </SectionHeader>

            <DocCard
              label="Participation unit"
              title="COPE Credits"
              copy="Users spend COPE Credits to enter markets — both Season markets and Pulse markets. Credits are separate from the $COPE protocol token."
              bullets={[
                "COPE Credits are not $COPE.",
                "COPE Credits are not redeemable token balances.",
                "COPE Credits do not automatically convert into $COPE.",
                "Credits are for gameplay and scoring — not monetary value.",
              ]}
            />
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Competition" title="Seasons and leaderboard">
              <p>{SEASON_OVERVIEW_COPY}</p>
            </SectionHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  How seasons work
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Seasons 1–3 run on COPE Credits. {SEASON_LEADERBOARD_QUALIFICATION_COPY}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {SEASON_FAQ_BULLETS.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span
                        aria-hidden
                        className="mt-2 size-1 shrink-0 rounded-full bg-cope-orange/70"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Leaderboard and rewards
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {SEASON_LEADERBOARD_RANKING_COPY}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {SEASON_SNAPSHOT_COPY} {SEASON_REWARDS_COPY}
                </p>
              </article>
            </div>

            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              {currentSeason.name} runs{" "}
              {new Date(currentSeason.startAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}{" "}
              through{" "}
              {new Date(currentSeason.endAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}{" "}
              (UTC). See the{" "}
              <DocLink href="/leaderboard">leaderboard</DocLink>.
            </p>
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Economic layer" title="Treasury Conviction and $COPE">
              <p>
                $COPE is the protocol token. During Seasons 1–3, it supports
                market rewards and Treasury Conviction — not direct in-market
                staking. Read the full explanation on{" "}
                <DocLink href="/cope">$COPE</DocLink>.
              </p>
            </SectionHeader>

            <DocCard
              label="Protocol token"
              title="Treasury Conviction"
              copy="Treasury Conviction is a visible $COPE allocation attached to selected Season markets. During Seasons 1–3 it is display and incentive signalling only."
              bullets={[
                "Shows where the Cope treasury commits attention and incentive weight.",
                "Does not change COPE Credit pricing, staking, settlement, or user balances.",
                "$COPE market rewards are reviewed after season snapshots — not auto-claimed.",
                "Full token economics are documented on the $COPE page.",
              ]}
            />
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Market layer" title="Resolution">
              <p>
                Markets eventually close. The Cope team resolves each market as
                Believe, Cope, or Void against its written criteria. Resolution
                updates market outcomes, COPE Credit positions, and leaderboard
                stats through database-backed logic.
              </p>
            </SectionHeader>

            <DocCard
              label="Outcomes"
              title="Resolution"
              copy="Every published Season market should have clear resolution criteria before it opens. Resolution is an admin action — not user-driven."
              bullets={[
                "Markets close at their scheduled close time.",
                "Resolution sets the winning side or voids the market.",
                "Winning positions receive credits from the market pool.",
                "season points update on settled winning positions.",
              ]}
            />
          </section>

          <section className="rounded-2xl border border-amber-300/50 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="mb-3">
              <StatusBadge tone="experimental">Important distinction</StatusBadge>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/85">
              <p>COPE Credits are not the same as the $COPE token.</p>
              <p>COPE Credits do not automatically convert into $COPE.</p>
              <p>Users do not stake $COPE directly in markets during Seasons 1–3.</p>
              <p>Subjective beliefs can remain social Belief Rooms.</p>
              <p>
                Only objective, measurable beliefs should become Season markets.
              </p>
            </div>
          </section>

          <section className="space-y-5">
            <SectionHeader eyebrow="Roadmap" title="What is not live yet">
              <p>
                Cope is designed to progressively integrate $COPE into the
                market layer after the first three seasons. These capabilities
                are future direction — not missing broken features.
              </p>
            </SectionHeader>

            <div className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
              <ul className="space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {NOT_LIVE_YET.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-400/80 dark:bg-zinc-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/markets"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Explore Markets
            </Link>
            <Link
              href="/cope"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200/80 bg-surface/50 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-surface/40 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
            >
              About $COPE
            </Link>
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-surface/50 p-5 dark:border-white/[0.07] dark:bg-surface/40">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Related pages
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <li>
                <DocLink href="/how-markets-work">How Markets Work</DocLink> —
                step-by-step market participation
              </li>
              <li>
                <DocLink href="/cope">$COPE</DocLink> — token role, COPE
                Credits, and Treasury Conviction
              </li>
              <li>
                <DocLink href="/markets">Markets</DocLink> — live Season markets
              </li>
              <li>
                <DocLink href="/leaderboard">Leaderboard</DocLink> — active
                season standings
              </li>
            </ul>
          </section>
        </div>
      </main>
    </InnerPageShell>
  );
}
