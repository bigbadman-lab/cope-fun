"use client";

import { useEffect, useState } from "react";
import {
  formatPulseCountdown,
  formatPulseCredits,
  formatPulsePercent,
  formatPulsePrice,
  pulseRoundStateBadgeClass,
  pulseRoundStateLabel,
  pulseWinningSideLabel,
  PULSE_MAX_STAKE,
  PULSE_MIN_STAKE,
  PULSE_STAKE_PRESETS,
  usePulseRoom,
  type PulseSide,
  type PulseStatusResponse,
  type PulseStatusRound,
  type PulseUserPosition,
  type PulseWinningSide,
} from "./use-pulse-room";

type PulseRoomHeaderProps = {
  beliefRoomId: string;
  belief: string;
  initialStatus?: PulseStatusResponse | null;
  mobileView?: "market" | "chat";
  onMobileViewChange?: (view: "market" | "chat") => void;
};

function winnerTextClass(side: PulseWinningSide | null): string {
  if (side === "believe") return "text-emerald-600 dark:text-emerald-400";
  if (side === "cope") return "text-rose-600 dark:text-rose-400";
  return "text-zinc-700 dark:text-zinc-200";
}

function displayWinningSide(
  round: PulseStatusRound | null,
  fallback: PulseWinningSide | null,
): PulseWinningSide | null {
  if (
    round &&
    (round.status === "locked" ||
      round.status === "settling" ||
      round.status === "settled") &&
    round.winningSide
  ) {
    return round.winningSide;
  }
  return fallback;
}

function positionResult(
  position: PulseUserPosition,
  round: PulseStatusRound | null,
  winner: PulseWinningSide | null,
): { label: string; className: string } {
  if (round?.status === "settled") {
    if (position.isWinner === true) {
      return {
        label: `Won +${formatPulseCredits(position.payoutCredits)}`,
        className: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (position.isWinner === false) {
      if (winner === "draw") {
        return {
          label: "Refunded (draw)",
          className: "text-zinc-600 dark:text-zinc-300",
        };
      }
      return { label: "Lost", className: "text-rose-600 dark:text-rose-400" };
    }
    return { label: "Settled", className: "text-zinc-600 dark:text-zinc-300" };
  }

  if (winner === "draw") {
    return { label: "Drawing", className: "text-zinc-600 dark:text-zinc-300" };
  }
  if (winner === position.side) {
    return {
      label: "Winning",
      className: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (winner === "believe" || winner === "cope") {
    return { label: "Losing", className: "text-rose-600 dark:text-rose-400" };
  }
  return { label: "Open", className: "text-zinc-600 dark:text-zinc-300" };
}

export function PulseRoomHeader({
  beliefRoomId,
  belief,
  initialStatus = null,
  mobileView = "market",
  onMobileViewChange,
}: PulseRoomHeaderProps) {
  const pulse = usePulseRoom(beliefRoomId, initialStatus);
  const { status, notFound } = pulse;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (notFound || (status && !status.ok)) {
    return null;
  }

  if (!status || !status.ok) {
    return (
      <div className="bg-background pb-3 pt-0.5">
        <section className="rounded-xl border border-cope-orange/30 bg-surface px-3.5 py-3.5 dark:border-cope-orange/20">
          <p className="text-xs text-zinc-500">Loading Pulse…</p>
        </section>
      </div>
    );
  }

  const { engine, round, livePrice, derived, automation } = status;
  const {
    authenticated,
    login,
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
  } = pulse;

  const roundStatus = round?.status ?? "pending";
  const isOpen = roundStatus === "open" && derived.isOpen;
  const isPending = !round || roundStatus === "pending";
  const isLocked = roundStatus === "locked" || roundStatus === "settling";
  const isSettled = roundStatus === "settled";

  const openPrice = round?.openingPrice ?? null;
  const livePriceValue = livePrice.price;
  const priceDelta =
    openPrice !== null && livePriceValue !== null
      ? livePriceValue - openPrice
      : null;
  const priceDeltaPercent =
    priceDelta !== null && openPrice
      ? (priceDelta / openPrice) * 100
      : null;

  const winner = displayWinningSide(round, derived.currentlyWinningSide);

  const openedAtMs = round?.openedAt ? Date.parse(round.openedAt) : null;
  const closesAtMs = round?.closesAt ? Date.parse(round.closesAt) : null;
  const liveSecondsRemaining =
    closesAtMs !== null
      ? Math.max(0, Math.ceil((closesAtMs - now) / 1000))
      : derived.secondsRemaining;
  const roundProgress =
    openedAtMs !== null && closesAtMs !== null && closesAtMs > openedAtMs
      ? Math.min(
          100,
          Math.max(0, ((now - openedAtMs) / (closesAtMs - openedAtMs)) * 100),
        )
      : 0;

  const directionColor =
    priceDirection === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : priceDirection === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-zinc-900 dark:text-zinc-50";
  const directionBg =
    priceDirection === "up"
      ? "bg-emerald-500/10"
      : priceDirection === "down"
        ? "bg-rose-500/10"
        : "bg-transparent";
  const deltaColor =
    priceDelta === null
      ? "text-zinc-500"
      : priceDelta > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : priceDelta < 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-zinc-500";
  const directionArrow =
    priceDelta === null || priceDelta === 0
      ? "→"
      : priceDelta > 0
        ? "▲"
        : "▼";

  const deltaText =
    priceDelta !== null
      ? `${priceDelta > 0 ? "+" : ""}${formatPulsePrice(priceDelta).replace(
          "$-",
          "-$",
        )}${
          priceDeltaPercent !== null
            ? ` (${priceDeltaPercent > 0 ? "+" : ""}${priceDeltaPercent.toFixed(2)}%)`
            : ""
        }`
      : null;

  const stakedSides = new Set<PulseSide>(userPositions.map((p) => p.side));
  const hasPosition = userPositions.length > 0;
  const alreadyStakedSelected = stakedSides.has(selectedSide);

  const yourPositionBlock = hasPosition ? (
    <div className="mt-2 rounded-lg border border-cope-orange/30 bg-cope-orange/[0.06] px-3 py-2 md:mt-3 md:py-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cope-orange">
        Your position
      </p>
      <ul className="space-y-1">
        {userPositions.map((position) => {
          const result = positionResult(position, round, winner);
          return (
            <li
              key={position.id}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`font-semibold ${
                    position.side === "believe"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {position.side === "believe" ? "Believe" : "Cope"}
                </span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                  {formatPulseCredits(position.stakeAmount)} credits
                </span>
              </span>
              <span className={`font-semibold ${result.className}`}>
                {result.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  const stakeControls =
    isOpen && canStake ? (
      !authenticated ? (
        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-zinc-200/60 pt-2.5 dark:border-white/[0.06] md:mt-3 md:pt-3">
          <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
            Sign in to stake COPE Credits this round.
          </p>
          <button
            type="button"
            onClick={() => login()}
            className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg bg-cope-orange px-4 text-xs font-semibold text-white"
          >
            Sign in
          </button>
        </div>
      ) : (
        <div
          className={`mt-2.5 border-t border-zinc-200/60 pt-2.5 dark:border-white/[0.06] md:mt-3 md:pt-3 ${
            hasPosition ? "opacity-90" : ""
          }`}
        >
          {hasPosition ? (
            <p className="mb-2 text-[11px] text-zinc-500">Add to your position</p>
          ) : null}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={isStaking}
                  onClick={() => setSelectedSide("believe")}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                    selectedSide === "believe"
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                  }`}
                >
                  Believe
                </button>
                <button
                  type="button"
                  disabled={isStaking}
                  onClick={() => setSelectedSide("cope")}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                    selectedSide === "cope"
                      ? "border-rose-400/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                  }`}
                >
                  Cope
                </button>
              </div>
              <p className="truncate text-[10px] text-zinc-500">
                {balanceCredits === null
                  ? "—"
                  : `${formatPulseCredits(balanceCredits)} credits`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {PULSE_STAKE_PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={isStaking}
                  onClick={() => {
                    setStakeAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums ${
                    !customAmount.trim() && stakeAmount === amount
                      ? "border-cope-orange/40 bg-cope-orange/10 text-cope-orange"
                      : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                  }`}
                >
                  {amount}
                </button>
              ))}
              <input
                type="number"
                min={PULSE_MIN_STAKE}
                max={PULSE_MAX_STAKE}
                step={1}
                value={customAmount}
                placeholder="Custom"
                disabled={isStaking}
                onChange={(event) => setCustomAmount(event.target.value)}
                className="w-[4.5rem] rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1 text-xs tabular-nums text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200"
              />
            </div>

            <button
              type="button"
              disabled={isStaking || !stakeValid || alreadyStakedSelected}
              onClick={() => void handleStake()}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-cope-orange text-sm font-semibold text-white disabled:opacity-60"
            >
              {isStaking
                ? "Staking…"
                : `Stake ${stakeValid ? effectiveStake : "—"} on ${
                    selectedSide === "believe" ? "Believe" : "Cope"
                  }`}
            </button>

            {alreadyStakedSelected ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                You’ve already staked on this side this round.
              </p>
            ) : !stakeValid ? (
              <p className="text-[11px] text-zinc-500">
                Enter an amount between {PULSE_MIN_STAKE} and {PULSE_MAX_STAKE}.
              </p>
            ) : null}
            {stakeError ? (
              <p className="text-[11px] text-rose-500">{stakeError}</p>
            ) : null}
            {stakeSuccess ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {stakeSuccess}
              </p>
            ) : null}
          </div>
        </div>
      )
    ) : (
      <p className="mt-2.5 border-t border-zinc-200/60 pt-2.5 text-[11px] text-zinc-500 dark:border-white/[0.06] md:mt-3 md:pt-3">
        {isPending
          ? !engineRunning && engine.lifecycleState === "ready"
            ? automation.runnerEnabled
              ? "Waiting for next round — opens automatically soon."
              : "Waiting for next round to open."
            : "Waiting for next round."
          : isLocked
            ? `Round locked${winner ? ` · ${pulseWinningSideLabel(winner)} winning` : ""}`
            : isSettled
              ? `Round settled${round?.winningSide ? ` · ${pulseWinningSideLabel(round.winningSide)} won` : ""}`
              : !engineRunning
                ? "Pulse is not running right now."
                : pulseRoundStateLabel(round, derived)}
      </p>
    );

  return (
    <div className="bg-background pb-3 pt-0.5">
      {onMobileViewChange ? (
        <div className="mb-2 grid grid-cols-2 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-1 dark:border-white/[0.06] dark:bg-zinc-950/70 md:hidden">
          {(["market", "chat"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => onMobileViewChange(view)}
              aria-pressed={mobileView === view}
              className={`min-h-9 rounded-lg text-xs font-semibold transition-colors ${
                mobileView === view
                  ? "bg-surface text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {view === "market" ? "Market" : "Live Chat"}
            </button>
          ))}
        </div>
      ) : null}

      {mobileView === "chat" ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-cope-orange/30 bg-surface px-3 py-2 dark:border-cope-orange/20 md:hidden">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cope-orange/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-cope-orange">
            <span className="size-1 animate-pulse rounded-full bg-cope-orange" />
            Live
          </span>
          <span className="shrink-0 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {engine.displayPair}
          </span>
          <span
            className={`shrink-0 font-mono text-sm font-bold tabular-nums ${directionColor}`}
          >
            {livePriceValue !== null ? formatPulsePrice(livePriceValue) : "—"}
          </span>
          <span className="ml-auto shrink-0 font-mono text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
            {isOpen
              ? formatPulseCountdown(liveSecondsRemaining)
              : pulseRoundStateLabel(round, derived)}
          </span>
        </div>
      ) : null}

      <section
        className={`overflow-hidden rounded-xl border border-cope-orange/30 bg-surface dark:border-cope-orange/20 ${
          mobileView === "chat" ? "hidden md:block" : ""
        }`}
      >
        <div className="px-3.5 py-2.5 md:py-3">
          {/* Top row: LIVE + pair + round # / status badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cope-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cope-orange">
                <span className="size-1.5 animate-pulse rounded-full bg-cope-orange" />
                Live
              </span>
              <span className="shrink-0 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {engine.displayPair}
              </span>
              <span className="shrink-0 text-[11px] text-zinc-400">
                #{round?.roundNumber ?? "—"}
              </span>
            </div>
            <span
              className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pulseRoundStateBadgeClass(round, derived)}`}
            >
              {pulseRoundStateLabel(round, derived)}
            </span>
          </div>

          {/* Belief title */}
          <h1 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-zinc-900 dark:text-zinc-50">
            {belief}
          </h1>

          {/* Hero price */}
          <div
            className={`mt-2 md:mt-2.5 rounded-xl px-3 py-2 md:py-2.5 transition-colors duration-500 ${directionBg}`}
          >
            {/* Desktop label row — redundant on mobile (top row already shows the pair + Live). */}
            <div className="hidden items-baseline justify-between gap-2 md:flex">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {engine.displayPair} · Live
              </span>
              {deltaText !== null ? (
                <span className={`text-[11px] font-semibold tabular-nums ${deltaColor}`}>
                  {deltaText}
                </span>
              ) : null}
            </div>
            <div className="mt-0 flex items-end gap-2 md:mt-0.5">
              <span
                className={`font-mono text-[2rem] font-bold leading-none tabular-nums transition-colors duration-300 md:text-[2.5rem] ${directionColor}`}
              >
                {livePriceValue !== null
                  ? formatPulsePrice(livePriceValue)
                  : "—"}
              </span>
              <span className={`pb-0.5 text-lg leading-none md:pb-1 ${deltaColor}`} aria-hidden>
                {directionArrow}
              </span>
              {deltaText !== null ? (
                <span
                  className={`ml-auto pb-0.5 text-[11px] font-semibold tabular-nums md:hidden ${deltaColor}`}
                >
                  {deltaText}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-zinc-500">
                Open{" "}
                <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatPulsePrice(openPrice)}
                </span>
              </span>
              {livePriceValue === null ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Live price unavailable
                </span>
              ) : (
                <span className="text-zinc-400">
                  {livePrice.source === "websocket"
                    ? "Live feed"
                    : livePrice.source === "rest_fallback"
                      ? "Fallback feed"
                      : ""}
                  {livePrice.priceStatus === "stale" ? " · stale" : ""}
                  {pollError ? " · reconnecting…" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Countdown + winner */}
          <div className="mt-2 grid grid-cols-2 gap-2 md:mt-3">
            <div className="rounded-lg border border-zinc-200/60 px-3 py-1.5 dark:border-white/[0.06] md:py-2">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {isOpen ? "Round ends in" : "Time"}
              </p>
              <p className="font-mono text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {isOpen
                  ? formatPulseCountdown(liveSecondsRemaining)
                  : isPending
                    ? "—"
                    : pulseRoundStateLabel(round, derived)}
              </p>
              {isOpen ? (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800/80">
                  <div
                    className="h-full bg-cope-orange transition-[width] duration-1000 ease-linear"
                    style={{ width: `${roundProgress}%` }}
                  />
                </div>
              ) : null}
            </div>
            <div className="rounded-lg border border-zinc-200/60 px-3 py-1.5 dark:border-white/[0.06] md:py-2">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {isSettled ? "Winner" : "Currently winning"}
              </p>
              <p className={`text-xl font-bold ${winnerTextClass(winner)}`}>
                {pulseWinningSideLabel(winner)}
              </p>
            </div>
          </div>

          {/* Pool split */}
          <div className="mt-2 md:mt-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px] tabular-nums">
              <span className="text-emerald-700/80 dark:text-emerald-400/80">
                Believe {formatPulsePercent(round?.believePercent)}
              </span>
              <span className="text-rose-700/80 dark:text-rose-400/80">
                Cope {formatPulsePercent(round?.copePercent)}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800/80">
              <div
                className="bg-emerald-600/60 transition-all duration-500"
                style={{ width: `${round?.believePercent ?? 0}%` }}
              />
              <div
                className="bg-rose-500/50 transition-all duration-500"
                style={{ width: `${round?.copePercent ?? 0}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] tabular-nums text-zinc-500">
              {formatPulseCredits(round?.believePool)} believe ·{" "}
              {formatPulseCredits(round?.copePool)} cope ·{" "}
              {formatPulseCredits(round?.totalPool)} pool
            </p>
          </div>

          {/* Your position */}
          {yourPositionBlock}

          {/* Stake controls / status */}
          {stakeControls}
        </div>
      </section>
    </div>
  );
}
