import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";
import {
  formatSeasonDateRange,
  formatSeasonSnapshotLabel,
  getCurrentSeason,
  SEASON_LEADERBOARD_RANKING_COPY,
  SEASON_REWARDS_COPY,
  SEASON_SNAPSHOT_COPY,
} from "@/lib/seasons";

const JOURNEY_STEPS = [
  {
    title: "Belief",
    copy: "A user submits a belief — a claim worth testing in public.",
  },
  {
    title: "Belief Room",
    copy: "One belief creates one Belief Room: a public record of the conviction under pressure.",
  },
  {
    title: "AI debate",
    copy: "AI agents — Mason, Victor, Logan, and Theo — pressure-test the belief from different angles.",
  },
  {
    title: "Community voting",
    copy: "Visitors vote Believe or Cope and add signal to what the community thinks.",
  },
  {
    title: "Team selection",
    copy: "The Cope team selects clear, measurable beliefs that can resolve inside the active season.",
  },
  {
    title: "Season market",
    copy: "Selected Belief Rooms become Season markets with Believe and Cope sides, close dates, and resolution criteria.",
  },
  {
    title: "Resolution",
    copy: "After close, the Cope team resolves the market as Believe, Cope, or Void against its criteria.",
  },
  {
    title: "Leaderboard",
    copy: "season points from winning settled positions determine your place on the Season leaderboard.",
  },
] as const;

const SEASON_MARKET_BULLETS = [
  "Not every Belief Room becomes a market.",
  "Markets are curated by the Cope team during the MVP.",
  "Markets require objective resolution criteria.",
  "Each market must have a clear close date.",
  "Markets reward thoughtful conviction — not random speculation.",
] as const;

function InfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40 ${className}`}
    >
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

function StepCard({
  step,
  title,
  copy,
}: {
  step: number;
  title: string;
  copy: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200/70 bg-background/60 px-3.5 py-3 dark:border-white/[0.06] dark:bg-background/35">
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-surface text-[11px] font-semibold text-zinc-500 dark:border-white/[0.08] dark:bg-surface/70">
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {copy}
          </p>
        </div>
      </div>
    </article>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cope-orange/80" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SeasonCard() {
  const currentSeason = getCurrentSeason();

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            {currentSeason.name}
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Active Season window
          </p>
        </div>
        <p className="rounded-full border border-zinc-200/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-background/40">
          UTC schedule
        </p>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {formatSeasonDateRange(currentSeason)}. All {currentSeason.name} markets
        resolve during {currentSeason.name}. {formatSeasonSnapshotLabel(currentSeason)}.
      </p>
    </section>
  );
}

function SideCard({
  title,
  copy,
  className,
}: {
  title: string;
  copy: string;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl border border-zinc-200/70 bg-background/60 px-3.5 py-3 dark:border-white/[0.06] dark:bg-background/35 ${className ?? ""}`}
    >
      <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {copy}
      </p>
    </article>
  );
}

export function HowMarketsWorkPage() {
  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            How Markets Work
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            From a single belief to a Season market.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Every market on Cope begins as a belief. Beliefs are debated by AI
            agents, challenged by the community, and selected by the Cope team
            before becoming Season markets.
          </p>
        </header>

        <div className="space-y-4">
          <InfoCard title="The journey">
            <section className="space-y-2.5">
              {JOURNEY_STEPS.map((item, index) => (
                <StepCard
                  key={item.title}
                  step={index + 1}
                  title={item.title}
                  copy={item.copy}
                />
              ))}
            </section>
          </InfoCard>

          <InfoCard title="Season markets">
            <p>
              Season markets are the conviction layer on top of Belief Rooms —
              curated, time-bound, and built to resolve clearly.
            </p>
            <BulletList items={SEASON_MARKET_BULLETS} />
          </InfoCard>

          <InfoCard title="COPE Credits">
            <p>
              During the first three seasons, users enter markets using COPE
              Credits. Credits power gameplay — they are not $COPE, not
              redeemable token balances, and do not automatically convert into
              $COPE.
            </p>
          </InfoCard>

          <InfoCard title="Believe vs Cope">
            <p className="mb-2.5">
              When a Season market is open, you choose one side:
            </p>
            <div className="space-y-2">
              <SideCard
                title="Believe"
                copy="You think the belief will be proven right by the resolution criteria."
              />
              <SideCard
                title="Cope"
                copy="You think the belief will fail — or that the evidence will land on the other side."
              />
            </div>
          </InfoCard>

          <InfoCard title="Resolution">
            <p className="mb-2">
              Markets close at their scheduled time. The Cope team then resolves
              each market as Believe, Cope, or Void.
            </p>
            <p className="mb-2">Resolution updates:</p>
            <BulletList
              items={[
                "market outcome",
                "open positions",
                "COPE Credit balances",
                "leaderboard season points",
              ]}
            />
          </InfoCard>

          <InfoCard title="Rewards">
            <p>{SEASON_LEADERBOARD_RANKING_COPY}</p>
            <p className="mt-2">
              {SEASON_SNAPSHOT_COPY} {SEASON_REWARDS_COPY} $COPE supports
              seasonal rewards behind the scenes — eligibility is reviewed after
              each season, not automatically claimed at close.
            </p>
          </InfoCard>

          <SeasonCard />

          <InfoCard title="Treasury Conviction">
            <p>
              Some featured Season markets display Treasury Conviction — a
              visible $COPE allocation associated with the market. During the
              first three seasons it does not affect pricing, staking,
              settlement, or user balances.
            </p>
            <p className="mt-2">
              <Link
                href="/cope"
                className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
              >
                Read more about $COPE
              </Link>
            </p>
          </InfoCard>

          <div className="border-t border-zinc-200/80 pt-4 dark:border-white/[0.06]">
            <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              Markets are one stage in the belief lifecycle. Every Season begins
              with ideas that survive debate.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/markets"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Explore Markets
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200/80 bg-surface/50 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-surface/40 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </InnerPageShell>
  );
}
