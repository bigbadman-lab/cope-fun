"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopeCreditsDisclaimer } from "./cope-credits-disclaimer";
import { MarketStatusBadge } from "./market-status-badge";
import { useAppAuth } from "@/hooks/use-app-auth";
import {
  canStakeOnMarket,
  getMarketDisplayStatus,
  isAwaitingResolution,
} from "@/lib/markets/display-status";
import {
  ALLOWED_STAKE_AMOUNTS,
  type CreditAccountView,
  type MarketSide,
  type RoomMarketView,
  type StakeAmount,
} from "@/lib/markets/types";

type RoomMarketPanelProps = {
  initialMarket: RoomMarketView;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RoomMarketPanel({ initialMarket }: RoomMarketPanelProps) {
  const { ready, authenticated, login, authFetch } = useAppAuth();
  const [market, setMarket] = useState(initialMarket);
  const [account, setAccount] = useState<CreditAccountView | null>(null);
  const [selectedSide, setSelectedSide] = useState<MarketSide>("believe");
  const [selectedStake, setSelectedStake] = useState<StakeAmount>(100);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayStatus = useMemo(
    () => getMarketDisplayStatus(market.status, market.closesAt),
    [market.status, market.closesAt],
  );

  const stakingAllowed = useMemo(
    () => canStakeOnMarket(market.status, market.closesAt),
    [market.status, market.closesAt],
  );

  const awaitingResolution = useMemo(
    () => isAwaitingResolution(market.status, market.closesAt),
    [market.status, market.closesAt],
  );

  const refreshAccount = useCallback(async () => {
    if (!authenticated) {
      setAccount(null);
      return;
    }

    const response = await authFetch("/api/credits/account");
    const payload = (await response.json()) as {
      ok: boolean;
      account?: CreditAccountView;
    };
    if (payload.ok && payload.account) {
      setAccount(payload.account);
    }
  }, [authenticated, authFetch]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!ready) return;

      try {
        if (authenticated) {
          await refreshAccount();
        } else {
          setAccount(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAccount(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, refreshAccount]);

  async function handleStake() {
    if (isStaking || market.userPosition || !stakingAllowed || !authenticated) return;

    setIsStaking(true);
    setError(null);

    try {
      const response = await authFetch(
        `/api/markets/${encodeURIComponent(market.id)}/stake`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            side: selectedSide,
            stakeCredits: selectedStake,
          }),
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        side?: MarketSide;
        stakeCredits?: number;
        balanceCredits?: number;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not stake.");
        return;
      }

      setMarket((current) => ({
        ...current,
        userPosition: {
          id: "local",
          side: payload.side ?? selectedSide,
          stakeCredits: payload.stakeCredits ?? selectedStake,
          payoutCredits: null,
          isWinner: null,
          settledAt: null,
        },
        believePool:
          selectedSide === "believe"
            ? current.believePool + selectedStake
            : current.believePool,
        copePool:
          selectedSide === "cope"
            ? current.copePool + selectedStake
            : current.copePool,
        participantCount: current.participantCount + 1,
      }));

      if (typeof payload.balanceCredits === "number") {
        setAccount((current) =>
          current
            ? { ...current, balanceCredits: payload.balanceCredits! }
            : current,
        );
      } else {
        await refreshAccount();
      }
    } finally {
      setIsStaking(false);
    }
  }

  const totalPool = market.believePool + market.copePool;
  const believePct =
    totalPool > 0 ? Math.round((market.believePool / totalPool) * 100) : 50;

  return (
    <section className="mt-3 rounded-xl border border-zinc-200/70 bg-background px-3.5 py-3.5 dark:border-white/[0.07]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-cope-orange">
          Market
        </p>
        <MarketStatusBadge dbStatus={market.status} closesAt={market.closesAt} />
      </div>

      <h2 className="mt-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
        {market.title}
      </h2>

      <p className="mt-2 text-xs leading-relaxed text-zinc-500">
        {market.resolutionCriteria}
      </p>

      {market.resolutionSource ? (
        <p className="mt-1 text-xs text-zinc-500">
          Source: {market.resolutionSource}
        </p>
      ) : null}

      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px] tabular-nums">
          <span className="text-emerald-700/80 dark:text-emerald-400/80">
            Believe {believePct}%
          </span>
          <span className="text-rose-700/80 dark:text-rose-400/80">
            Cope {100 - believePct}%
          </span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800/80">
          <div
            className="bg-emerald-600/60"
            style={{ width: `${believePct}%` }}
          />
          <div
            className="bg-rose-500/50"
            style={{ width: `${100 - believePct}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        {totalPool.toLocaleString()} credits staked ·{" "}
        {market.participantCount}{" "}
        {market.participantCount === 1 ? "participant" : "participants"}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        Market closes {formatDateTime(market.closesAt)}
        {market.resolvesAt
          ? ` · Resolves ${formatDateTime(market.resolvesAt)}`
          : ""}
      </p>

      {stakingAllowed && !market.userPosition && !authenticated ? (
        <div className="mt-4 space-y-3 border-t border-zinc-200/60 pt-4 dark:border-white/[0.06]">
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Sign in to receive COPE Credits and enter this market.
          </p>
          <button
            type="button"
            onClick={() => login()}
            className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-cope-orange text-sm font-medium text-white"
          >
            Sign in
          </button>
        </div>
      ) : null}

      {stakingAllowed && authenticated && !market.userPosition ? (
        <div className="mt-4 space-y-3 border-t border-zinc-200/60 pt-4 dark:border-white/[0.06]">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Stake COPE Credits before the market closes.
          </p>

          <p className="text-xs text-zinc-500">
            {isLoadingAccount
              ? "Loading balance…"
              : `Available: ${(account?.balanceCredits ?? 0).toLocaleString()} COPE Credits`}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSide("believe")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                selectedSide === "believe"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
              }`}
            >
              Believe
            </button>
            <button
              type="button"
              onClick={() => setSelectedSide("cope")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                selectedSide === "cope"
                  ? "border-rose-400/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
              }`}
            >
              Cope
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALLOWED_STAKE_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedStake(amount)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums ${
                  selectedStake === amount
                    ? "border-cope-orange/40 bg-cope-orange/10 text-cope-orange"
                    : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isStaking || isLoadingAccount}
            onClick={() => void handleStake()}
            className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-cope-orange text-sm font-medium text-white disabled:opacity-60"
          >
            {isStaking ? "Staking…" : `Stake ${selectedStake} credits`}
          </button>

          <CopeCreditsDisclaimer />

          {error ? <p className="text-xs text-rose-500">{error}</p> : null}
        </div>
      ) : null}

      {displayStatus === "awaiting_resolution" && !market.userPosition ? (
        <p className="mt-3 text-xs text-zinc-500">
          Market closed. Awaiting admin resolution.
        </p>
      ) : null}

      {market.userPosition ? (
        <div className="mt-4 rounded-lg border border-zinc-200/70 bg-surface/40 px-3 py-2.5 dark:border-white/[0.07] dark:bg-surface/30">
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            Your position:{" "}
            {market.userPosition.side === "believe" ? "Believe" : "Cope"} ·{" "}
            {market.userPosition.stakeCredits.toLocaleString()} credits
          </p>
          {awaitingResolution && market.userPosition.settledAt === null ? (
            <p className="mt-1 text-xs text-zinc-500">
              Market closed. Awaiting admin resolution.
            </p>
          ) : null}
          {market.status === "resolved" && market.userPosition.isWinner !== null ? (
            <p className="mt-1 text-xs text-zinc-500">
              {market.userPosition.isWinner
                ? `Won ${(market.userPosition.payoutCredits ?? 0).toLocaleString()} credits`
                : "No payout"}
            </p>
          ) : null}
          {market.status === "voided" ? (
            <p className="mt-1 text-xs text-zinc-500">
              Voided · refunded{" "}
              {(market.userPosition.payoutCredits ?? market.userPosition.stakeCredits).toLocaleString()}{" "}
              credits
            </p>
          ) : null}
          {displayStatus === "open" ? (
            <p className="mt-1 text-xs text-zinc-500">Pending result.</p>
          ) : null}
        </div>
      ) : null}

      {market.status === "closed" && !market.userPosition ? (
        <p className="mt-3 text-xs text-zinc-500">
          Market closed. Awaiting admin resolution.
        </p>
      ) : null}

      {market.status === "resolved" && market.outcome ? (
        <>
          <p className="mt-3 text-xs font-medium text-cope-orange">
            Resolved: {market.outcome === "believe" ? "Believe" : "Cope"} wins
          </p>
          {market.resolutionNotes ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {market.resolutionNotes}
            </p>
          ) : null}
        </>
      ) : null}

      {market.status === "voided" ? (
        <>
          <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
            Market voided — stakes refunded
          </p>
          {market.resolutionNotes ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {market.resolutionNotes}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
