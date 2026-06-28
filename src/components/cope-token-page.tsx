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
  "COPE Credits power gameplay.",
  "$COPE funds market rewards.",
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
    question: "Is $COPE live?",
    answer:
      "Not yet. $COPE is planned as the protocol token for Cope.",
  },
  {
    question: "Can I buy $COPE today?",
    answer:
      "Not yet. Official launch details will be published before TGE.",
  },
  {
    question: "What are COPE Credits?",
    answer:
      "COPE Credits are virtual gameplay credits used in the first three seasons.",
  },
  {
    question: "Are COPE Credits tokens?",
    answer:
      "No. They are not tokens, not redeemable balances, and do not automatically convert into $COPE.",
  },
  {
    question: "What does $COPE do at launch?",
    answer:
      "$COPE supports market rewards, Treasury Conviction, and the transition toward deeper token integration.",
  },
  {
    question: "When does $COPE become fully integrated?",
    answer:
      "Cope is designed to progressively integrate $COPE after the first three seasons, once the credit-based market economy has been tested.",
  },
] as const;

export function CopeTokenPage() {
  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            $COPE
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            The token powering the internet&apos;s conviction network.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Cope launches with a credit-based market economy first. $COPE
            supports rewards, Treasury Conviction, and the long-term transition
            toward on-chain markets.
          </p>
        </header>

        <div className="space-y-5">
          <Section title="Why $COPE exists">
            <p>
              Most crypto projects launch a token first and hope a product
              follows. Cope is taking the opposite path.
            </p>
            <p>The belief network comes first.</p>
            <p>
              $COPE exists to become the economic layer of that network.
            </p>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="The first three seasons">
            <p>
              For Seasons 1–3, markets run on COPE Credits. Users submit
              beliefs, agents debate them, the community votes, and selected
              rooms become markets. Players use credits to enter markets and
              compete on the leaderboard.
            </p>
            <p>
              $COPE sits behind the system as reward and treasury incentive
              capital.
            </p>
            <InfoCard title="During Seasons 1–3">
              <BulletList items={SEASONS_ONE_TO_THREE} />
            </InfoCard>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="Why COPE Credits?">
            <p>
              COPE Credits let Cope test market mechanics, resolution rules,
              and leaderboard behaviour before introducing direct on-chain market
              participation. This keeps the early product simple while still
              giving $COPE a clear role from launch.
            </p>
            <InfoCard title="Important distinction">
              <ul className="space-y-1.5">
                <li>COPE Credits are not tokens.</li>
                <li>COPE Credits are not redeemable balances.</li>
                <li>
                  COPE Credits do not automatically convert into $COPE.
                </li>
              </ul>
            </InfoCard>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="Treasury Conviction">
            <p>
              Featured markets may carry a Treasury Conviction allocation. This
              is a visible $COPE allocation associated with selected markets.
              During the first three seasons it is display and incentive
              signalling only. It does not change COPE Credit pricing, staking,
              settlement, or user balances.
            </p>
            <InfoCard title="Treasury Conviction">
              <p>
                A protocol-backed $COPE signal attached to featured markets. It
                shows where the Cope treasury is committing attention and
                incentive weight.
              </p>
            </InfoCard>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="After Season 3">
            <p>
              Following the first three seasons, Cope is designed to
              progressively integrate $COPE into the market layer. This is when
              the system can move beyond credits toward on-chain mechanics.
            </p>
            <div className="rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
              <TimelineItem
                label="Season 1"
                copy="Launch the belief market network"
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
                copy="Progressively integrate $COPE into the market layer"
                isLast
              />
            </div>
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <Section title="Long-term direction">
            <p>
              The long-term goal is an on-chain conviction network powered by
              $COPE.
            </p>
            <BulletList items={LONG_TERM_DIRECTION} />
          </Section>

          <div className="h-px bg-zinc-200/80 dark:bg-white/[0.06]" />

          <InfoCard title="Token launch details">
            <p>
              Token supply, distribution, and launch details will be published
              before TGE. Until then, this page explains the intended role of
              $COPE inside the product.
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/how-markets-work"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200/80 bg-surface/50 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-surface/40 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
            >
              How Markets Work
            </Link>
            <Link
              href="/docs"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </div>
    </InnerPageShell>
  );
}
