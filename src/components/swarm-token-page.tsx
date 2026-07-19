import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";

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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="space-y-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cope-orange/80" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <article className="rounded-xl border border-zinc-200/70 bg-background/60 px-3.5 py-3 dark:border-white/[0.06] dark:bg-background/35">
      <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {question}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {answer}
      </p>
    </article>
  );
}

function TimelineItem({
  label,
  copy,
  isLast = false,
}: {
  label: string;
  copy: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="size-2 shrink-0 rounded-full border border-cope-orange/40 bg-cope-orange/20" />
        {!isLast ? (
          <div className="mt-1 w-px flex-1 bg-zinc-200/80 dark:bg-white/[0.08]" />
        ) : null}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-3"}`}>
        <p className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {copy}
        </p>
      </div>
    </div>
  );
}

const SEASONS_ONE_TO_THREE = [
  "Swarm Credits power gameplay.",
  "Treasury Conviction signals protocol commitment.",
  "The product collects data before deeper token integration.",
] as const;

const LONG_TERM_DIRECTION = [
  "Token-powered market participation",
  "Holder rewards",
  "On-chain market mechanics",
  "Community market creation",
  "Treasury-backed incentives",
  "Community ownership over the network",
] as const;

const FAQ = [
  {
    question: "Is $SWARM live?",
    answer:
      "Not yet. $SWARM is the upcoming token for the Hoodswarm ecosystem on Robinhood Chain. It has not launched and is not tradable.",
  },
  {
    question: "Can I buy $SWARM today?",
    answer:
      "No. There is no contract address, no listing, and no legitimate way to buy $SWARM today. Treat any token claiming to be $SWARM before an official announcement as fake.",
  },
  {
    question: "What are Swarm Credits?",
    answer:
      "Swarm Credits are virtual gameplay credits used in the first three seasons.",
  },
  {
    question: "Are Swarm Credits tokens?",
    answer:
      "No. They are not tokens, not redeemable balances, and do not automatically convert into $SWARM.",
  },
  {
    question: "What will $SWARM do?",
    answer:
      "$SWARM is planned to support market rewards, Treasury Conviction, and the long-term transition toward deeper token integration.",
  },
  {
    question: "When does $SWARM launch?",
    answer:
      "Launch details — contract address, supply, and distribution — will be published through official Hoodswarm channels before launch.",
  },
] as const;

export function SwarmTokenPage() {
  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              $SWARM
            </h1>
            <span className="rounded-full border border-cope-orange/40 bg-cope-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700 dark:text-cope-orange">
              Upcoming
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            The token powering the internet&apos;s conviction network.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            $SWARM is the upcoming token for the Hoodswarm ecosystem on
            Robinhood Chain. It has not launched yet. Hoodswarm runs Seasons
            1–3 on Swarm Credits for gameplay while the token economy is being
            prepared.
          </p>
        </header>

        <div className="space-y-5">
          <Section title="Why $SWARM exists">
            <p>
              Most crypto projects launch a token first and hope a product
              follows. Hoodswarm is taking the opposite path.
            </p>
            <p>The belief network comes first.</p>
            <p>
              $SWARM exists to become the economic layer of that network.
            </p>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="The first three seasons">
            <p>
              For Seasons 1–3, markets run on Swarm Credits. Users submit
              beliefs, agents debate them, the community votes, and selected
              rooms become markets. Players use credits to enter markets and
              compete on the leaderboard.
            </p>
            <InfoCard title="During Seasons 1–3">
              <BulletList items={SEASONS_ONE_TO_THREE} />
            </InfoCard>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="Why Swarm Credits?">
            <p>
              Swarm Credits let Hoodswarm test market mechanics, resolution
              rules, and leaderboard behaviour before introducing direct
              on-chain market participation. This keeps the early product
              simple while the token economy is designed properly.
            </p>
            <InfoCard title="Important distinction">
              <ul className="space-y-1.5">
                <li>Swarm Credits are not tokens.</li>
                <li>Swarm Credits are not redeemable balances.</li>
                <li>
                  Swarm Credits do not automatically convert into $SWARM.
                </li>
              </ul>
            </InfoCard>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="Treasury Conviction">
            <p>
              Featured markets may carry a Treasury Conviction allocation. This
              is a visible $SWARM allocation associated with selected markets.
              During the first three seasons it is display and incentive
              signalling only. It does not change Swarm Credit pricing,
              staking, settlement, or user balances.
            </p>
            <InfoCard title="Treasury Conviction">
              <p>
                A protocol-backed $SWARM signal attached to featured markets.
                It shows where the Hoodswarm treasury intends to commit
                attention and incentive weight.
              </p>
            </InfoCard>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="After Season 3">
            <p>
              Following the first three seasons, Hoodswarm is designed to
              progressively integrate $SWARM into the market layer. This is
              when the system can move beyond credits toward on-chain
              mechanics.
            </p>
            <div className="rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
              <TimelineItem
                label="Season 1"
                copy="Launch the Season market network"
              />
              <TimelineItem
                label="Season 2"
                copy="Grow participation and improve market quality"
              />
              <TimelineItem
                label="Season 3"
                copy="Validate the economy"
              />
              <TimelineItem
                label="Next"
                copy="Progressively integrate $SWARM into the market layer"
                isLast
              />
            </div>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="Long-term direction">
            <p>
              The long-term goal is an on-chain conviction network powered by
              $SWARM on Robinhood Chain.
            </p>
            <BulletList items={LONG_TERM_DIRECTION} />
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <InfoCard title="Token details">
            <p>
              $SWARM has not launched. There is no contract address yet.
              Supply, distribution, and launch details will be published
              through official Hoodswarm channels before launch. Do not trust
              any token claiming to be $SWARM until then.
            </p>
          </InfoCard>

          <Section title="FAQ">
            <div className="space-y-2">
              {FAQ.map((item) => (
                <FaqItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </Section>

          <p className="border-t border-zinc-200/80 pt-4 text-[13px] leading-relaxed text-zinc-600 dark:border-white/[0.06] dark:text-zinc-400">
            The first three seasons are about proving the product. Everything
            after that is about decentralising it.
          </p>

          <p className="text-[13px] leading-relaxed text-zinc-500">
            <Link
              href="/how-markets-work"
              className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
            >
              How markets work
            </Link>
            {" · "}
            <Link
              href="/docs"
              className="font-medium text-cope-orange underline decoration-cope-orange/30 underline-offset-2 transition-colors hover:decoration-cope-orange/60"
            >
              Docs
            </Link>
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/markets"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Explore Markets
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200/80 bg-surface/50 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-surface/40 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
            >
              Share a belief
            </Link>
          </div>
        </div>
      </div>
    </InnerPageShell>
  );
}
