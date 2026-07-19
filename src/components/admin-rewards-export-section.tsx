"use client";

import { getSeasonExportId } from "@/lib/seasons";
import type { Season } from "@/lib/seasons";

type AdminRewardsExportSectionProps = {
  season: Season;
  missingWalletCount: number;
};

export function AdminRewardsExportSection({
  season,
  missingWalletCount,
}: AdminRewardsExportSectionProps) {
  const seasonExportId = getSeasonExportId(season);
  const exportHref = `/api/admin/leaderboard/export?seasonId=${encodeURIComponent(seasonExportId)}`;

  return (
    <section className="mt-10 rounded-2xl border border-zinc-200/80 bg-surface p-5 dark:border-white/[0.08] dark:bg-surface">
      <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
        Rewards export
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
        For manual $SWARM reward review. This does not send tokens.
      </p>

      {missingWalletCount > 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-[13px] leading-relaxed text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          {missingWalletCount} qualified leaderboard{" "}
          {missingWalletCount === 1 ? "user is" : "users are"} missing a rewards
          wallet address. They will appear in the CSV with{" "}
          <span className="font-mono">wallet_missing=true</span>.
        </p>
      ) : null}

      <div className="mt-4">
        <a
          href={exportHref}
          className="inline-flex min-h-10 items-center rounded-xl border border-cope-orange/25 bg-cope-orange/10 px-4 text-sm font-medium text-cope-orange transition-colors hover:bg-cope-orange/15"
        >
          Export {season.name} leaderboard CSV
        </a>
      </div>
    </section>
  );
}
