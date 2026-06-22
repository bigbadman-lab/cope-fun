"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { InnerPageShell } from "./inner-page-shell";
import {
  formatFollowedDate,
  getFollowedRoomsSnapshot,
  FOLLOWED_ROOMS_SERVER_SNAPSHOT,
  subscribeFollowedRooms,
  unfollowRoom,
} from "@/lib/followed-rooms";
import {
  connectMockWallet,
  disconnectMockWallet,
  formatWalletAddress,
  getWalletSessionSnapshot,
  subscribeWalletSession,
  WALLET_SESSION_SERVER_SNAPSHOT,
} from "@/lib/wallet-session";
import {
  getMockProfile,
  getMockProfilePath,
  type MockProfile,
  type MockProfileNote,
  type MockProfilePosition,
} from "@/lib/mock-profiles";
import { ProfileAvatarEditor } from "./profile-avatar-editor";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-background/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-background/35">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function SideBadge({ side }: { side: "believe" | "cope" }) {
  const isBelieve = side === "believe";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        isBelieve
          ? "border-emerald-300/50 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/35 dark:bg-emerald-950/15 dark:text-emerald-400/85"
          : "border-rose-300/50 bg-rose-50/70 text-rose-800 dark:border-rose-900/35 dark:bg-rose-950/15 dark:text-rose-400/85"
      }`}
    >
      {isBelieve ? "Believe" : "Cope"}
    </span>
  );
}

function PositionPreview({ position }: { position: MockProfilePosition }) {
  return (
    <div className="border-b border-zinc-200/60 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {position.marketTitle}
        </p>
        <SideBadge side={position.side} />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {position.stakeAmount.toLocaleString()} credits · {position.status}
      </p>
    </div>
  );
}

function NotePreview({ note }: { note: MockProfileNote }) {
  return (
    <div className="border-b border-zinc-200/60 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {note.marketTitle}
        </p>
        <SideBadge side={note.side} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {note.body}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{note.createdAt}</p>
    </div>
  );
}

function SeasonPreview({ profile }: { profile: MockProfile }) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Season Preview
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
            Local MVP reputation snapshot.
          </p>
        </div>
        <Link
          href={getMockProfilePath(profile.username)}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Public profile
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatCard label="COPE Credits" value={profile.copeCredits.toLocaleString()} />
        <StatCard label="Season Rank" value={`#${profile.seasonRank}`} />
        <StatCard
          label="Season Points"
          value={profile.seasonPoints.toLocaleString()}
        />
        <StatCard label="Win Rate" value={`${profile.winRate}%`} />
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Active Positions
        </h3>
        {profile.activePositions.slice(0, 2).map((position) => (
          <PositionPreview key={position.id} position={position} />
        ))}
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Recent Conviction Notes
        </h3>
        {profile.recentConvictionNotes.slice(0, 2).map((note) => (
          <NotePreview key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}

export function ProfilePage() {
  const localProfile = getMockProfile("Alex");
  const wallet = useSyncExternalStore(
    subscribeWalletSession,
    getWalletSessionSnapshot,
    () => WALLET_SESSION_SERVER_SNAPSHOT,
  );

  const followedRooms = useSyncExternalStore(
    subscribeFollowedRooms,
    getFollowedRoomsSnapshot,
    () => FOLLOWED_ROOMS_SERVER_SNAPSHOT,
  );

  return (
    <InnerPageShell>
      <div className="inner-page-content w-full max-w-md !py-5">
        <h1 className="pb-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile
        </h1>

        {!wallet.connected ? (
          <div className="rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-5 dark:border-white/[0.07] dark:bg-surface/40">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Connect wallet to view your profile and follow rooms.
            </p>
            <button
              type="button"
              onClick={() => connectMockWallet()}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-zinc-200/80 bg-background px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-background dark:text-zinc-200 dark:hover:bg-white/[0.04]"
            >
              Connect wallet
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-surface/40">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Connected
            </p>
            <p className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
              {wallet.address ? formatWalletAddress(wallet.address) : "—"}
            </p>
            <button
              type="button"
              onClick={() => disconnectMockWallet()}
              className="mt-3 text-xs text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Disconnect
            </button>
          </div>
        )}

        {wallet.connected && localProfile && <SeasonPreview profile={localProfile} />}

        {wallet.connected && (
          <section className="mb-6 rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Avatar
            </h2>
            <ProfileAvatarEditor />
          </section>
        )}

        <section className={wallet.connected ? "" : "pointer-events-none opacity-50"}>
          <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Following
          </h2>

          {wallet.connected && followedRooms.length === 0 ? (
            <p className="py-8 text-center text-sm leading-relaxed text-zinc-500">
              Follow rooms to build your belief profile.
            </p>
          ) : wallet.connected ? (
            <ul className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
              {followedRooms.map((room) => (
                <li key={room.slug} className="py-3.5 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/room/${room.slug}`}
                        className="block text-[15px] font-medium leading-snug text-zinc-900 transition-colors hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                      >
                        {room.belief}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">
                        Followed {formatFollowedDate(room.followedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => unfollowRoom(room.slug)}
                      className="shrink-0 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
                    >
                      Unfollow
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              Connect wallet to see rooms you follow.
            </p>
          )}
        </section>
      </div>
    </InnerPageShell>
  );
}
