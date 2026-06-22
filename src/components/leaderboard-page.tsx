import Link from "next/link";
import { InnerPageShell } from "./inner-page-shell";
import {
  getMockProfilePath,
  getMockProfiles,
  type MockProfile,
} from "@/lib/mock-profiles";

function SeasonBanner() {
  return (
    <section className="mb-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
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
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-zinc-200/70 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:border-white/[0.07] dark:bg-background/35">
          Mock data
        </span>
        <span className="rounded-full border border-zinc-200/70 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:border-white/[0.07] dark:bg-background/35">
          Local MVP preview
        </span>
      </div>
    </section>
  );
}

function TopBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;

  return (
    <span className="rounded-full border border-cope-orange/25 bg-cope-orange/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-cope-orange">
      Top {rank}
    </span>
  );
}

function LeaderboardRow({ user }: { user: MockProfile }) {
  return (
    <div className="border-b border-zinc-200/60 last:border-b-0 dark:border-white/[0.06]">
      <Link
        href={getMockProfilePath(user.username)}
        className="group -mx-2 flex items-start gap-3 rounded-xl px-2 py-3.5 transition-[background-color,transform] duration-300 ease-out hover:bg-zinc-900/[0.04] active:scale-[0.998] active:bg-zinc-900/[0.06] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06] sm:py-4"
      >
        <div className="w-6 shrink-0 pt-1 text-center text-xs font-medium tabular-nums text-zinc-500">
          #{user.seasonRank}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-surface text-xs font-semibold text-zinc-600 transition-transform duration-300 ease-out group-hover:scale-[1.04] dark:border-white/[0.08] dark:bg-surface/70 dark:text-zinc-300">
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-[15px] font-medium leading-snug text-zinc-900 transition-colors duration-300 ease-out group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
              {user.username}
            </p>
            <TopBadge rank={user.seasonRank} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span>
              <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {user.seasonPoints.toLocaleString()}
              </span>{" "}
              Season Points
            </span>
            <span>
              <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {user.copeCredits.toLocaleString()}
              </span>{" "}
              Credits
            </span>
            <span>{user.winRate}% win rate</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function RewardsCard() {
  return (
    <section className="mt-5 rounded-xl border border-zinc-200/80 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        How rewards work
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Earn Season Points by making profitable market calls. At the end of each
        30 day season, top-ranked users share the $COPE reward pool.
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        Stage 1 preview: 100,000,000 $COPE incentive pool over 6 seasons.
      </p>
    </section>
  );
}

export function LeaderboardPage() {
  const users = getMockProfiles();

  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Leaderboard
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            The best conviction traders of Season 1.
          </p>
        </header>

        <SeasonBanner />

        {users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base text-zinc-500">No rankings yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Season rankings will appear once markets are active.
            </p>
          </div>
        ) : (
          <section className="w-full">
            {users.map((user) => (
              <LeaderboardRow key={user.username} user={user} />
            ))}
          </section>
        )}

        <RewardsCard />
      </div>
    </InnerPageShell>
  );
}
