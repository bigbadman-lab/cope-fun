"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  connectMockWallet,
  useWalletSession,
} from "@/lib/wallet-session";
import {
  isRoomFollowed,
  subscribeFollowedRooms,
  toggleFollowRoom,
} from "@/lib/followed-rooms";
import { navIconActiveClass, navIconButtonClass, navIconClass } from "./theme-toggle";

function FollowIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 4.5h10a2 2 0 0 1 2 2v12.8a.7.7 0 0 1-1.12.56L12 17.2l-5.88 4.66A.7.7 0 0 1 5 21.3V6.5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

type RoomFollowButtonProps = {
  slug: string;
  roomId: string | null;
  belief: string;
};

/**
 * Local follow bookmark — uses temporary wallet-session gating, not Privy.
 * Unrelated to market staking or COPE Credits.
 */
export function RoomFollowButton({ slug, roomId, belief }: RoomFollowButtonProps) {
  const followGate = useWalletSession();
  const following = useSyncExternalStore(
    subscribeFollowedRooms,
    () => isRoomFollowed(slug),
    () => false,
  );
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(() => {
    if (busy) return;

    setBusy(true);
    window.setTimeout(() => setBusy(false), 200);

    if (!followGate.connected) {
      connectMockWallet();
      toggleFollowRoom({ slug, roomId, belief });
      return;
    }

    toggleFollowRoom({ slug, roomId, belief });
  }, [belief, busy, roomId, slug, followGate.connected]);

  const ariaLabel = !followGate.connected
    ? "Enable follow for this room"
    : following
      ? "Unfollow room"
      : "Follow room";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={followGate.connected ? following : undefined}
      title={
        !followGate.connected
          ? "Enable follow"
          : following
            ? "Following"
            : "Follow room"
      }
      className={`${navIconButtonClass} transition-colors duration-200 ${
        followGate.connected && following
          ? `${navIconActiveClass} text-cope-orange dark:text-cope-orange`
          : !followGate.connected
            ? "opacity-70"
            : ""
      }`}
    >
      <FollowIcon
        className={navIconClass}
        filled={followGate.connected && following}
      />
    </button>
  );
}
