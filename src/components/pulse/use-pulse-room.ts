"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppAuth } from "@/hooks/use-app-auth";

export const PULSE_POLL_INTERVAL_MS = 1000;
export const PULSE_STAKE_PRESETS = [25, 50, 100, 250] as const;
export const PULSE_MIN_STAKE = 1;
export const PULSE_MAX_STAKE = 1000;

export type PulseSide = "believe" | "cope";
export type PulseWinningSide = "believe" | "cope" | "draw";

export type PulseStatusEngine = {
  id: string;
  beliefRoomId: string;
  displayPair: string;
  lifecycleState: string;
  health: string;
  roundDurationSeconds: number;
};

export type PulseStatusRound = {
  id: string;
  roundNumber: number;
  status: string;
  openedAt: string | null;
  closesAt: string | null;
  settledAt: string | null;
  openingPrice: number | null;
  openingPriceSource: string | null;
  closingPrice: number | null;
  winningSide: PulseWinningSide | null;
  believePool: number;
  copePool: number;
  seedCredits: number;
  totalPool: number;
  believePercent: number;
  copePercent: number;
};

export type PulseStatusLivePrice = {
  price: number | null;
  source: "websocket" | "rest_fallback" | null;
  updatedAt: string | null;
  connectionStatus: string;
  priceAgeMs: number | null;
  priceStatus: "ok" | "unavailable" | "stale" | null;
};

export type PulseStatusDerived = {
  secondsRemaining: number | null;
  isOpen: boolean;
  isClosed: boolean;
  currentlyWinningSide: PulseWinningSide | null;
};

export type PulseStatusAutomation = {
  runnerEnabled: boolean;
  willOpenNextRoundAutomatically: boolean;
};

export type PulseStatusResponse =
  | {
      ok: true;
      engine: PulseStatusEngine;
      round: PulseStatusRound | null;
      livePrice: PulseStatusLivePrice;
      derived: PulseStatusDerived;
      automation: PulseStatusAutomation;
    }
  | { ok: false; error: string };

type StakeResponse =
  | { ok: true; round: { believePool: number; copePool: number } }
  | { ok: false; error: string };

type CreditAccountResponse = {
  ok: boolean;
  account?: { balanceCredits: number };
};

export type PulseUserPosition = {
  id: string;
  roundId: string;
  side: PulseSide;
  stakeAmount: number;
  payoutCredits: number | null;
  isWinner: boolean | null;
  settledAt: string | null;
  createdAt: string;
};

type MyPositionResponse =
  | { ok: true; authenticated: boolean; positions: PulseUserPosition[] }
  | { ok: false; error: string };

export function formatPulsePrice(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPulsePercent(value: number | null | undefined): string {
  return `${Math.round(value ?? 0)}%`;
}

export function formatPulseCredits(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString();
}

export function formatPulseCountdown(secondsRemaining: number | null): string {
  if (secondsRemaining === null) return "—";
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function pulseRoundStateLabel(
  round: PulseStatusRound | null,
  derived: PulseStatusDerived | null,
): string {
  if (!round) return "Pending";

  switch (round.status) {
    case "pending":
      return "Pending";
    case "open":
      return derived && derived.secondsRemaining === 0
        ? "Closing"
        : "Open";
    case "locked":
      return "Locked";
    case "settling":
      return "Settling";
    case "settled":
      return "Settled";
    case "cancelled":
      return "Cancelled";
    case "errored":
      return "Needs review";
    default:
      return round.status;
  }
}

export function pulseRoundStateBadgeClass(
  round: PulseStatusRound | null,
  derived: PulseStatusDerived | null,
): string {
  if (!round || round.status === "pending") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (round.status === "open" && derived?.isOpen) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (round.status === "locked" || round.status === "settling") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }

  if (round.status === "settled") {
    return "border-zinc-400/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }

  return "border-zinc-300/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
}

export function pulseWinningSideLabel(side: PulseWinningSide | null): string {
  if (side === "believe") return "Believe";
  if (side === "cope") return "Cope";
  if (side === "draw") return "Draw";
  return "—";
}

export function usePulseRoom(
  beliefRoomId: string,
  initialStatus: PulseStatusResponse | null = null,
) {
  const { ready, authenticated, login, authFetch } = useAppAuth();

  const [status, setStatus] = useState<PulseStatusResponse | null>(
    initialStatus,
  );
  const [notFound, setNotFound] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<PulseSide>("believe");
  const [stakeAmount, setStakeAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isStaking, setIsStaking] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [stakeSuccess, setStakeSuccess] = useState<string | null>(null);
  const [balanceCredits, setBalanceCredits] = useState<number | null>(null);
  const [userPositions, setUserPositions] = useState<PulseUserPosition[]>([]);

  const previousPriceRef = useRef<number | null>(
    initialStatus && initialStatus.ok ? initialStatus.livePrice.price : null,
  );
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(
    null,
  );

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pulse/status?beliefRoomId=${encodeURIComponent(beliefRoomId)}`,
        { cache: "no-store" },
      );

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      const payload = (await response.json()) as PulseStatusResponse;

      // Keep the last good snapshot on a failed poll; surface the error subtly
      // instead of clearing the module.
      if (!payload.ok) {
        setPollError(payload.error || "Live update failed.");
        return;
      }

      setNotFound(false);
      setPollError(null);
      setStatus(payload);

      if (payload.livePrice.price !== null) {
        const previous = previousPriceRef.current;
        if (previous !== null && payload.livePrice.price !== previous) {
          setPriceDirection(payload.livePrice.price > previous ? "up" : "down");
        }
        previousPriceRef.current = payload.livePrice.price;
      }
    } catch {
      // Keep last good snapshot if a single poll fails.
      setPollError("Live update failed.");
    }
  }, [beliefRoomId]);

  useEffect(() => {
    void loadStatus();
    const interval = window.setInterval(() => {
      void loadStatus();
    }, PULSE_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadStatus]);

  const refreshBalance = useCallback(async () => {
    if (!authenticated) {
      setBalanceCredits(null);
      return;
    }

    try {
      const response = await authFetch("/api/credits/account");
      const payload = (await response.json()) as CreditAccountResponse;
      if (payload.ok && payload.account) {
        setBalanceCredits(payload.account.balanceCredits);
      }
    } catch {
      // Non-critical; balance display falls back to placeholder.
    }
  }, [authenticated, authFetch]);

  useEffect(() => {
    if (!ready) return;
    void refreshBalance();
  }, [ready, authenticated, refreshBalance]);

  const currentRoundId = status && status.ok ? (status.round?.id ?? null) : null;

  const loadPosition = useCallback(
    async (roundId: string) => {
      try {
        const response = await authFetch(
          `/api/pulse/my-position?roundId=${encodeURIComponent(roundId)}`,
        );
        const payload = (await response.json()) as MyPositionResponse;
        if (payload.ok) {
          setUserPositions(payload.authenticated ? payload.positions : []);
        }
      } catch {
        // Keep last known position snapshot if a single poll fails.
      }
    },
    [authFetch],
  );

  useEffect(() => {
    if (!ready) return;

    if (!authenticated || !currentRoundId) {
      setUserPositions([]);
      return;
    }

    void loadPosition(currentRoundId);
  }, [ready, authenticated, currentRoundId, loadPosition]);

  useEffect(() => {
    if (priceDirection === null) return;
    const timer = window.setTimeout(() => setPriceDirection(null), 700);
    return () => window.clearTimeout(timer);
  }, [priceDirection, status]);

  const ok = status && status.ok ? status : null;
  const engineRunning = ok?.engine.lifecycleState === "running";
  const canStake = Boolean(
    engineRunning &&
      ok &&
      ok.round &&
      ok.round.status === "open" &&
      ok.derived.isOpen &&
      ok.derived.secondsRemaining !== 0,
  );

  const effectiveStake = customAmount.trim()
    ? Number(customAmount)
    : stakeAmount;
  const stakeValid =
    Number.isInteger(effectiveStake) &&
    effectiveStake >= PULSE_MIN_STAKE &&
    effectiveStake <= PULSE_MAX_STAKE;

  const handleStake = useCallback(async () => {
    const current = status && status.ok ? status : null;
    const isOpenForStake = Boolean(
      current &&
        current.engine.lifecycleState === "running" &&
        current.round &&
        current.round.status === "open" &&
        current.derived.isOpen &&
        current.derived.secondsRemaining !== 0,
    );

    const stake = customAmount.trim() ? Number(customAmount) : stakeAmount;
    const valid =
      Number.isInteger(stake) &&
      stake >= PULSE_MIN_STAKE &&
      stake <= PULSE_MAX_STAKE;

    if (!current || isStaking || !isOpenForStake || !authenticated || !valid) {
      return;
    }

    setIsStaking(true);
    setStakeError(null);
    setStakeSuccess(null);

    try {
      const response = await authFetch("/api/pulse/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId: current.engine.id,
          side: selectedSide,
          stakeAmount: stake,
        }),
      });

      const payload = (await response.json()) as StakeResponse;

      if (!response.ok || !payload.ok) {
        setStakeError(payload.ok ? "Could not place stake." : payload.error);
        return;
      }

      setStakeSuccess(
        `Staked ${stake} on ${selectedSide === "believe" ? "Believe" : "Cope"}.`,
      );
      const refreshTasks: Promise<unknown>[] = [loadStatus(), refreshBalance()];
      if (current.round) {
        refreshTasks.push(loadPosition(current.round.id));
      }
      await Promise.all(refreshTasks);
    } catch {
      setStakeError("Could not place stake.");
    } finally {
      setIsStaking(false);
    }
  }, [
    status,
    customAmount,
    stakeAmount,
    isStaking,
    authenticated,
    authFetch,
    selectedSide,
    loadStatus,
    refreshBalance,
    loadPosition,
  ]);

  return {
    ready,
    authenticated,
    login,
    status,
    notFound,
    pollError,
    priceDirection,
    engineRunning,
    canStake,
    selectedSide,
    setSelectedSide,
    stakeAmount,
    setStakeAmount,
    customAmount,
    setCustomAmount,
    isStaking,
    stakeError,
    stakeSuccess,
    balanceCredits,
    userPositions,
    effectiveStake,
    stakeValid,
    handleStake,
  };
}
