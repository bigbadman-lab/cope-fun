"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InnerPageShell } from "./inner-page-shell";
import { ProfileAvatarCustomizer } from "./profile-avatar-customizer";
import { UserAccountAvatar } from "./user-account-avatar";
import { useAccountAvatar } from "./account-avatar-provider";
import { useAppAuth } from "@/hooks/use-app-auth";
import {
  COPE_CREDITS_DISCLAIMER,
  getMarketDisplayStatusLabel,
} from "@/lib/markets/display-status";
import {
  formatWalletAddress,
  getCurrentSeason,
  SEASON_ELIGIBILITY_NOTE,
  SEASON_WALLET_PROFILE_COPY,
  SEASON_WALLET_SIGNUP_COPY,
} from "@/lib/seasons";
import type {
  ProfileCreatedRoomSummary,
  ProfileDashboard,
  ProfileMarketPositionSummary,
  ProfileUserSummary,
} from "@/lib/profile/types";

type ProfileResponse =
  | ({ ok: true } & ProfileDashboard & {
      disclaimers?: { credits: string };
    })
  | { ok: false; error?: string };

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

function HiddenBadge() {
  return (
    <span className="rounded-full border border-zinc-300/50 bg-zinc-100/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
      Hidden
    </span>
  );
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatClosesAt(iso: string): string {
  return `Closes ${formatShortDate(iso)}`;
}

function OutcomeBadge({
  position,
}: {
  position: ProfileMarketPositionSummary;
}) {
  if (position.marketStatus === "voided") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
        Voided
      </span>
    );
  }

  if (position.isWinner === true) {
    return (
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
        Won
      </span>
    );
  }

  if (position.isWinner === false) {
    return (
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-rose-600 dark:text-rose-400">
        Lost
      </span>
    );
  }

  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
      {getMarketDisplayStatusLabel(position.displayStatus)}
    </span>
  );
}

function PositionRow({
  position,
  variant,
}: {
  position: ProfileMarketPositionSummary;
  variant: "active" | "resolved";
}) {
  const href = `/room/${position.roomSlug}`;

  return (
    <div className="border-b border-zinc-200/60 py-3.5 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-start gap-2">
        <Link
          href={href}
          className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-900 transition-colors hover:text-cope-orange dark:text-zinc-100 dark:hover:text-cope-orange"
        >
          {position.marketTitle}
        </Link>
        <SideBadge side={position.side} />
      </div>

      <p className="mt-1.5 text-xs text-zinc-500">
        {position.stakeCredits.toLocaleString()} credits staked
        {variant === "active" ? (
          <>
            {" · "}
            {getMarketDisplayStatusLabel(position.displayStatus)}
            {" · "}
            {formatClosesAt(position.closesAt)}
          </>
        ) : (
          <>
            {" · "}
            <OutcomeBadge position={position} />
            {position.payoutCredits !== null && (
              <>
                {" · "}
                {position.payoutCredits.toLocaleString()} payout
              </>
            )}
            {position.pnl !== null && (
              <>
                {" · "}
                <span
                  className={
                    position.pnl >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }
                >
                  {position.pnl >= 0 ? "+" : ""}
                  {position.pnl.toLocaleString()} P&L
                </span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}

function CreatedRoomRow({ room }: { room: ProfileCreatedRoomSummary }) {
  return (
    <div className="border-b border-zinc-200/60 py-3.5 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-start gap-2">
        <Link
          href={`/room/${room.slug}`}
          className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-900 transition-colors hover:text-cope-orange dark:text-zinc-100 dark:hover:text-cope-orange"
        >
          {room.belief}
        </Link>
        {room.isHidden && <HiddenBadge />}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Created {formatShortDate(room.createdAt)}
      </p>
    </div>
  );
}

function ProfileSignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  const currentSeason = getCurrentSeason();

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-5 dark:border-white/[0.07] dark:bg-surface/40">
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Sign in to track your COPE Credits, enter markets, view your{" "}
        {currentSeason.name} rank, and manage your beliefs.
      </p>
      <button
        type="button"
        onClick={onSignIn}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cope-orange/30 bg-cope-orange/10 px-4 text-sm font-medium text-cope-orange transition-colors hover:bg-cope-orange/15 sm:w-auto"
      >
        Sign in
      </button>
    </div>
  );
}

function ProfileLoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
      <div className="h-44 animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07]" />
      <div className="h-28 animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07]" />
      <div className="h-28 animate-pulse rounded-xl border border-zinc-200/70 bg-surface/40 dark:border-white/[0.07]" />
    </div>
  );
}

function ProfileErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200/70 bg-rose-50/40 px-4 py-5 dark:border-rose-900/30 dark:bg-rose-950/20">
      <p className="text-sm text-rose-800 dark:text-rose-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-zinc-200/80 bg-background px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-background dark:text-zinc-200 dark:hover:bg-white/[0.04]"
      >
        Try again
      </button>
    </div>
  );
}

function SeasonHeroCard({ dashboard }: { dashboard: ProfileDashboard }) {
  const { user, season, account } = dashboard;
  const rankLabel =
    season.isQualified && season.rank !== null
      ? `#${season.rank}`
      : season.isQualified
        ? "Unranked"
        : "—";
  const winRateLabel =
    account.winRate !== null ? `${account.winRate}%` : "—";

  return (
    <section className="mb-6 rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <UserAccountAvatar
            label={user.label}
            avatarColor={user.avatarColor}
            avatarPublicUrl={user.avatarPublicUrl}
            avatarUpdatedAt={user.avatarUpdatedAt}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-cope-orange">
              {season.name}
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {user.label}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {user.walletAddress && user.email
                ? "Wallet and email linked"
                : user.walletAddress
                  ? "Wallet linked"
                  : user.email
                    ? "Email linked"
                    : "Signed in"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            COPE Credits
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {account.balanceCredits.toLocaleString()}
          </p>
        </div>
      </div>

      {!season.isQualified && season.qualificationMessage && (
        <p className="mt-4 rounded-lg border border-cope-orange/20 bg-cope-orange/[0.06] px-3 py-2.5 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {season.qualificationMessage}{" "}
          <Link
            href="/markets"
            className="font-medium text-cope-orange hover:underline"
          >
            View markets
          </Link>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Season rank" value={rankLabel} />
        <StatCard
          label="Markets entered"
          value={account.marketsEntered.toLocaleString()}
        />
        <StatCard label="Win rate" value={winRateLabel} />
        <StatCard
          label="Season points"
          value={account.seasonPoints.toLocaleString()}
        />
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
        {season.eligibilityNote || SEASON_ELIGIBILITY_NOTE} Season rank uses
        season points from winning settled markets. Lifetime credits won:{" "}
        {account.totalWonCredits.toLocaleString()}.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {COPE_CREDITS_DISCLAIMER}
      </p>
    </section>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

function getAuthMethodLabel(
  walletAddress: string | null,
  email: string | null,
): string {
  if (walletAddress && email) return "Wallet and Email";
  if (walletAddress) return "Wallet";
  if (email) return "Email";
  return "Privy";
}

function SeasonWalletSection({ walletAddress }: { walletAddress: string | null }) {
  return (
    <ProfileSection title="Season wallet">
      {walletAddress ? (
        <>
          <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
            {formatWalletAddress(walletAddress)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">
            {walletAddress}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {SEASON_WALLET_PROFILE_COPY}
          </p>
        </>
      ) : (
        <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {SEASON_WALLET_SIGNUP_COPY}
        </p>
      )}
    </ProfileSection>
  );
}

function ProfileAccountSection({ user }: { user: ProfileUserSummary }) {
  const router = useRouter();
  const { logout } = useAppAuth();
  const [signingOut, setSigningOut] = useState(false);

  const authMethod = getAuthMethodLabel(user.walletAddress, user.email);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }, [logout, router, signingOut]);

  return (
    <>
      <ProfileSection title="Account">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          {authMethod}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {user.label}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Signed in with Privy</p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          aria-busy={signingOut}
          className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-zinc-200/80 bg-background px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-background dark:text-zinc-300 dark:hover:bg-white/[0.04]"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </ProfileSection>

      <p className="pb-2 text-center text-[11px] tracking-wide text-zinc-500 dark:text-zinc-600">
        Cope Beta
      </p>
    </>
  );
}

function ProfileDashboardView({
  dashboard,
  onUserUpdated,
}: {
  dashboard: ProfileDashboard;
  onUserUpdated: (user: ProfileUserSummary) => void;
}) {
  return (
    <>
      <SeasonHeroCard dashboard={dashboard} />

      <SeasonWalletSection walletAddress={dashboard.user.walletAddress} />

      <ProfileAvatarCustomizer user={dashboard.user} onUserUpdated={onUserUpdated} />

      <ProfileSection title="Active Markets">
        {dashboard.activePositions.length === 0 ? (
          <p className="text-sm leading-relaxed text-zinc-500">
            You have no active market positions yet.{" "}
            <Link
              href="/markets"
              className="font-medium text-cope-orange hover:underline"
            >
              View markets
            </Link>
          </p>
        ) : (
          dashboard.activePositions.map((position) => (
            <PositionRow
              key={position.id}
              position={position}
              variant="active"
            />
          ))
        )}
      </ProfileSection>

      <ProfileSection title="Your Beliefs">
        {dashboard.createdRooms.length === 0 ? (
          <p className="text-sm leading-relaxed text-zinc-500">
            Your saved beliefs will appear here.{" "}
            <Link
              href="/"
              className="font-medium text-cope-orange hover:underline"
            >
              Create a belief
            </Link>
          </p>
        ) : (
          dashboard.createdRooms.map((room) => (
            <CreatedRoomRow key={room.id} room={room} />
          ))
        )}
      </ProfileSection>

      <ProfileSection title="Resolved Market History">
        {dashboard.resolvedPositions.length === 0 ? (
          <p className="text-sm leading-relaxed text-zinc-500">
            Resolved markets will appear here.
          </p>
        ) : (
          dashboard.resolvedPositions.map((position) => (
            <PositionRow
              key={position.id}
              position={position}
              variant="resolved"
            />
          ))
        )}
      </ProfileSection>

      <ProfileAccountSection user={dashboard.user} />
    </>
  );
}

export function ProfilePage() {
  const { ready, authenticated, login, authFetch } = useAppAuth();
  const { applyAvatarFromUser } = useAccountAvatar();
  const currentSeason = getCurrentSeason();
  const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/profile/me");
      const payload = (await response.json()) as ProfileResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok === false
            ? (payload.error ?? "Could not load profile.")
            : "Could not load profile.",
        );
      }

      setDashboard({
        user: payload.user,
        season: payload.season,
        account: payload.account,
        activePositions: payload.activePositions,
        resolvedPositions: payload.resolvedPositions,
        createdRooms: payload.createdRooms,
      });
      applyAvatarFromUser(payload.user);
    } catch (err) {
      setDashboard(null);
      setError(
        err instanceof Error ? err.message : "Could not load profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch, applyAvatarFromUser]);

  const handleUserUpdated = useCallback((user: ProfileUserSummary) => {
    setDashboard((current) => (current ? { ...current, user } : current));
  }, []);

  useEffect(() => {
    if (!ready || !authenticated) return;

    let cancelled = false;

    async function run() {
      await loadProfile();
      if (cancelled) return;
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, loadProfile, fetchKey]);

  const handleRetry = useCallback(() => {
    setFetchKey((value) => value + 1);
  }, []);

  return (
    <InnerPageShell topFade>
      <div className="inner-page-content w-full max-w-md !py-5">
        <header className="pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Profile
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            Your private {currentSeason.name} dashboard.
          </p>
        </header>

        {!ready ? (
          <ProfileLoadingState />
        ) : !authenticated ? (
          <ProfileSignInPrompt onSignIn={() => login()} />
        ) : loading && !dashboard ? (
          <ProfileLoadingState />
        ) : error ? (
          <ProfileErrorState message={error} onRetry={handleRetry} />
        ) : dashboard ? (
          <ProfileDashboardView
            dashboard={dashboard}
            onUserUpdated={handleUserUpdated}
          />
        ) : null}
      </div>
    </InnerPageShell>
  );
}
