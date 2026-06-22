import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";

const STEPS = [
  {
    title: "A belief becomes a market",
    copy: "The Cope team selects clear, time-bound beliefs that can resolve inside the active season.",
  },
  {
    title: "Stake COPE Credits",
    copy: "Choose Believe or Cope and stake credits on the side you think will be proven right.",
  },
  {
    title: "Leave a Conviction Note",
    copy: "Optionally explain your reasoning. Notes are published with your stake and are not general comments.",
  },
  {
    title: "Markets resolve",
    copy: "When the outcome is known, winning positions receive credits from the market pool.",
  },
  {
    title: "Climb the leaderboard",
    copy: "Profitable calls earn Season Points. At season end, top users share the $COPE reward pool.",
  },
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

function SeasonCard() {
  return (
    <section className="rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cope-orange">
            Season 1
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            25,000,000 $COPE rewards
          </p>
        </div>
        <p className="rounded-full border border-zinc-200/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-background/40">
          30 day competition
        </p>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        All Season 1 markets resolve during Season 1.
      </p>
    </section>
  );
}

function CtaLinks() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
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
  );
}

export function HowMarketsWorkPage() {
  return (
    <InnerPageShell>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            How Markets Work
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            Cope turns beliefs into monthly conviction competitions.
          </p>
        </header>

        <div className="space-y-4">
          <InfoCard title="MVP market preview">
            Markets are selected by the Cope team from belief rooms. You do not
            stake real tokens in the MVP. You use COPE Credits to back Believe
            or Cope and compete for seasonal rewards.
          </InfoCard>

          <section className="space-y-2.5">
            {STEPS.map((item, index) => (
              <StepCard
                key={item.title}
                step={index + 1}
                title={item.title}
                copy={item.copy}
              />
            ))}
          </section>

          <SeasonCard />

          <InfoCard title="MVP note">
            COPE Credits are off-chain points during the MVP. Wallet connection
            will be used for identity, while credits, markets, and leaderboards
            are database-driven.
          </InfoCard>

          <CtaLinks />
        </div>
      </div>
    </InnerPageShell>
  );
}
