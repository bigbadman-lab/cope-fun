"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatConversationTime } from "@/lib/saved-chats";
import { AdminMarketsSection } from "./admin-markets-section";
import type {
  AdminDashboardData,
  AdminRoomAction,
  AdminRoomSummary,
} from "@/lib/admin/dashboard-types";
import type { AdminMarketsData } from "@/lib/markets/types";

type AdminDashboardProps = {
  data: AdminDashboardData;
  marketsData: AdminMarketsData;
};

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-surface p-5 dark:border-white/[0.08] dark:bg-surface">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function RoomStatusBadges({ room }: { room: AdminRoomSummary }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {room.isHidden ? (
        <span className="rounded-full border border-orange-200/80 bg-orange-50/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-orange-800 dark:border-orange-400/20 dark:bg-orange-950/30 dark:text-orange-100">
          Hidden
        </span>
      ) : null}
      {room.isFeatured ? (
        <span className="rounded-full border border-cope-orange/25 bg-cope-orange/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-cope-orange">
          Featured
        </span>
      ) : null}
      {room.isMarketCandidate ? (
        <span className="rounded-full border border-zinc-200/80 bg-zinc-100/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300">
          Market candidate
        </span>
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  active = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-8 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-cope-orange/30 bg-cope-orange/10 text-cope-orange"
          : "border-zinc-200/80 text-zinc-600 hover:bg-zinc-900/[0.04] dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
      }`}
    >
      {label}
    </button>
  );
}

function AdminRoomRow({
  room,
  metricLabel,
  metricValue,
}: {
  room: AdminRoomSummary;
  metricLabel: string;
  metricValue: number;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<AdminRoomAction | null>(
    null,
  );

  async function runAction(action: AdminRoomAction) {
    if (pendingAction) return;

    setPendingAction(action);
    try {
      const response = await fetch(
        `/api/admin/rooms/${encodeURIComponent(room.id)}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setPendingAction(null);
    }
  }

  const isPending = pendingAction !== null;

  return (
    <li className="border-b border-zinc-200/60 last:border-b-0 dark:border-white/[0.06]">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/room/${room.slug}`}
              className="truncate text-sm font-medium text-zinc-900 transition-colors hover:text-cope-orange dark:text-zinc-100"
            >
              {room.belief}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">
              {formatConversationTime(room.createdAt)} · Believe {room.believePct}
              % · Cope {room.copePct}%
            </p>
            <RoomStatusBadges room={room} />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatNumber(metricValue)}
            </p>
            <p className="text-xs text-zinc-500">{metricLabel}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton
            label={room.isHidden ? "Unhide" : "Hide"}
            onClick={() => void runAction(room.isHidden ? "unhide" : "hide")}
            disabled={isPending}
            active={room.isHidden}
          />
          <ActionButton
            label={room.isFeatured ? "Unfeature" : "Feature"}
            onClick={() =>
              void runAction(room.isFeatured ? "unfeature" : "feature")
            }
            disabled={isPending}
            active={room.isFeatured}
          />
          <ActionButton
            label={
              room.isMarketCandidate
                ? "Remove candidate"
                : "Mark candidate"
            }
            onClick={() =>
              void runAction(
                room.isMarketCandidate
                  ? "remove_market_candidate"
                  : "mark_market_candidate",
              )
            }
            disabled={isPending}
            active={room.isMarketCandidate}
          />
        </div>
      </div>
    </li>
  );
}

function RoomLeaderboard({
  title,
  description,
  rooms,
  metricLabel,
  getMetricValue,
}: {
  title: string;
  description: string;
  rooms: AdminRoomSummary[];
  metricLabel: string;
  getMetricValue: (room: AdminRoomSummary) => number;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-background dark:border-white/[0.08]">
      <div className="border-b border-zinc-200/60 px-5 py-4 dark:border-white/[0.06]">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      {rooms.length === 0 ? (
        <p className="px-5 py-6 text-sm text-zinc-500">No rooms yet.</p>
      ) : (
        <ul>
          {rooms.map((room) => (
            <AdminRoomRow
              key={room.id}
              room={room}
              metricLabel={metricLabel}
              metricValue={getMetricValue(room)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminDashboard({ data, marketsData }: AdminDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Product metrics and moderation across all published belief rooms.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="inline-flex min-h-10 items-center rounded-xl border border-zinc-200/80 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-900/[0.04] disabled:opacity-60 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
        >
          {isLoggingOut ? "Signing out…" : "Log out"}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
          Overview
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total rooms" value={data.totals.rooms} />
          <StatCard label="Total votes" value={data.totals.votes} />
          <StatCard label="Total reactions" value={data.totals.reactions} />
          <StatCard
            label="Attention challenges"
            value={data.totals.challenges}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
          Markets
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Create markets from candidate rooms, publish for staking, close, then
          resolve or void manually.
        </p>
        <AdminMarketsSection data={marketsData} />
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-2">
        <RoomLeaderboard
          title="Recent rooms"
          description="All published rooms, including hidden."
          rooms={data.recentRooms}
          metricLabel="challenges"
          getMetricValue={(room) => room.challengeCount}
        />
        <RoomLeaderboard
          title="Most voted"
          description="Highest vote totals across all published rooms."
          rooms={data.mostVotedRooms}
          metricLabel="votes"
          getMetricValue={(room) => room.voteCount}
        />
        <RoomLeaderboard
          title="Most challenged"
          description="Most Attention Challenges across all published rooms."
          rooms={data.mostChallengedRooms}
          metricLabel="challenges"
          getMetricValue={(room) => room.challengeCount}
        />
        <RoomLeaderboard
          title="Most reacted"
          description="Most agent reactions across all published rooms."
          rooms={data.mostReactedRooms}
          metricLabel="reactions"
          getMetricValue={(room) => room.reactionCount}
        />
      </section>
    </div>
  );
}
