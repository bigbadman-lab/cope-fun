"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "@/hooks/use-app-auth";
import {
  isLeaderboardQualified,
  LEADERBOARD_UNQUALIFIED_HINT,
} from "@/lib/leaderboard/eligibility";

type ProfileMeResponse =
  | {
      ok: true;
      account: { marketsEntered: number };
    }
  | { ok: false };

export function LeaderboardQualificationHint() {
  const { ready, authenticated, authFetch } = useAppAuth();
  const [unqualified, setUnqualified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) return;

    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch("/api/profile/me");
        const payload = (await response.json()) as ProfileMeResponse;

        if (cancelled || !response.ok || !payload.ok) {
          return;
        }

        setUnqualified(!isLeaderboardQualified(payload.account.marketsEntered));
      } catch {
        // Ignore — hint is optional UX polish.
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, authFetch]);

  const showHint = ready && authenticated && unqualified === true;

  if (!showHint) return null;

  return (
    <div className="mb-4 rounded-xl border border-cope-orange/20 bg-cope-orange/[0.06] px-4 py-3">
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {LEADERBOARD_UNQUALIFIED_HINT}{" "}
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
