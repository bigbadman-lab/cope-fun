"use client";

import Link from "next/link";
import { useAccountAvatar } from "./account-avatar-provider";
import { useAppAuth } from "@/hooks/use-app-auth";
import { getLeaderboardUnqualifiedHint } from "@/lib/leaderboard/eligibility";

export function LeaderboardQualificationHint() {
  const { ready, authenticated } = useAppAuth();
  const { dashboard } = useAccountAvatar();

  const unqualified = dashboard ? !dashboard.season.isQualified : null;
  const showHint = ready && authenticated && unqualified === true;

  if (!showHint) return null;

  return (
    <div className="mb-4 rounded-xl border border-cope-orange/20 bg-cope-orange/[0.06] px-4 py-3">
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {getLeaderboardUnqualifiedHint()}{" "}
        <Link
          href="/markets"
          className="font-medium text-cope-orange hover:underline"
        >
          View markets
        </Link>
      </p>
    </div>
  );
}
