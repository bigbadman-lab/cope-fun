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

export function ProfilePage() {
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
