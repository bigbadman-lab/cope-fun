"use client";

import { useEffect, useState } from "react";
import {
  formatMarketVolume,
  formatTimeRemaining,
  getDefaultEntrySize,
  getIncreaseSize,
  getMarketWinner,
  isMarketClosed,
  type MarketPosition,
  type MarketSnapshot,
} from "@/lib/market";

type MarketLiveProps = {
  market: MarketSnapshot;
};

function useAnimatedPercent(target: number, enabled: boolean) {
  const [display, setDisplay] = useState(50);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const from = 50;
    const start = performance.now();
    const duration = 800;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  return enabled ? display : target;
}

function ConvictionChart({
  history,
  muted,
}: {
  history: MarketSnapshot["convictionHistory"];
  muted: boolean;
}) {
  const width = 280;
  const height = 48;
  const padding = 4;
  const minPct = Math.min(...history.map((point) => point.believePct)) - 4;
  const maxPct = Math.max(...history.map((point) => point.believePct)) + 4;
  const range = Math.max(maxPct - minPct, 1);

  const points = history
    .map((point, index) => {
      const x =
        padding +
        (index / Math.max(history.length - 1, 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((point.believePct - minPct) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-12 w-full ${muted ? "opacity-40" : ""}`}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={muted ? "rgb(113 113 122 / 0.5)" : "rgb(16 185 129 / 0.55)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function PositionCard({ position }: { position: MarketPosition }) {
  const isBelieve = position.side === "believe";

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isBelieve
          ? "border-emerald-900/35 bg-emerald-950/20"
          : "border-rose-900/35 bg-rose-950/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Your position
          </p>
          <p
            className={`mt-0.5 text-sm font-medium ${
              isBelieve ? "text-emerald-300/90" : "text-rose-300/90"
            }`}
          >
            {isBelieve ? "Believe" : "Cope"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Size
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-200">
            {position.size}
            <span className="ml-1 text-xs font-normal text-zinc-500">
              credits
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function WinnerBanner({
  winner,
  believePct,
  copePct,
}: {
  winner: ReturnType<typeof getMarketWinner>;
  believePct: number;
  copePct: number;
}) {
  const label =
    winner === "tie"
      ? `Final conviction split · Believe ${believePct}% / Cope ${copePct}%`
      : winner === "believe"
        ? `Believe won · ${believePct}% final conviction`
        : `Cope won · ${copePct}% final conviction`;

  return (
    <p
      className={`rounded-lg border px-3 py-2 text-xs ${
        winner === "believe"
          ? "border-emerald-900/30 bg-emerald-950/15 text-emerald-400/80"
          : winner === "cope"
            ? "border-rose-900/30 bg-rose-950/15 text-rose-400/80"
            : "border-zinc-800 bg-zinc-900/40 text-zinc-400"
      }`}
    >
      {label}
    </p>
  );
}

export function MarketUnavailableNote() {
  return (
    <p className="border-b border-white/5 pb-4 text-[11px] leading-relaxed text-zinc-600">
      No live market on this room. Markets attach to selected beliefs only.
    </p>
  );
}

export function MarketLive({ market }: MarketLiveProps) {
  const [position, setPosition] = useState<MarketPosition | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const closed = isMarketClosed(market.endsAt, now);
  const winner = getMarketWinner(market.believePct, market.copePct);
  const displayBelievePct = useAnimatedPercent(market.believePct, !closed);
  const displayCopePct = 100 - displayBelievePct;
  const timeRemaining = formatTimeRemaining(market.endsAt, now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  function enterPosition(side: MarketPosition["side"]) {
    if (closed) return;
    setPosition({ side, size: getDefaultEntrySize() });
  }

  function increasePosition() {
    if (closed) return;
    setPosition((current) =>
      current
        ? { ...current, size: current.size + getIncreaseSize() }
        : current,
    );
  }

  function exitPosition() {
    setPosition(null);
  }

  return (
    <section
      className={`border-b border-white/5 pb-4 ${
        closed ? "opacity-80" : ""
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
            closed
              ? "border-zinc-800 bg-zinc-900/50 text-zinc-500"
              : "border-emerald-900/50 bg-emerald-950/30 text-emerald-400/90"
          }`}
        >
          {!closed && (
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500/80" />
          )}
          {closed ? "Market closed" : "Market live"}
        </span>
        <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
          {market.durationHours ?? 72}h market
        </span>
        <span className="ml-auto text-[11px] text-zinc-500">
          {closed ? "Ended" : `${timeRemaining} left`}
        </span>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-zinc-600">
        Conviction, not truth — stake a side, not a verdict.
      </p>

      <div className="mb-2 flex items-baseline justify-between text-xs tabular-nums">
        <span className="text-emerald-400/85 transition-colors duration-300">
          Believe {displayBelievePct}%
        </span>
        <span className="text-rose-400/85 transition-colors duration-300">
          Cope {displayCopePct}%
        </span>
      </div>

      <div className="mb-3 flex h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="bg-emerald-600/60 transition-[width] duration-700 ease-out"
          style={{ width: `${displayBelievePct}%` }}
        />
        <div
          className="bg-rose-500/50 transition-[width] duration-700 ease-out"
          style={{ width: `${displayCopePct}%` }}
        />
      </div>

      <ConvictionChart history={market.convictionHistory} muted={closed} />

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
        <span>{market.participants.toLocaleString()} participants</span>
        <span>{formatMarketVolume(market.volume)} vol</span>
      </div>

      {closed && (
        <div className="mt-3">
          <WinnerBanner
            winner={winner}
            believePct={market.believePct}
            copePct={market.copePct}
          />
        </div>
      )}

      {!closed && (
        <>
          <div className="mt-3">
            {position ? (
              <PositionCard position={position} />
            ) : (
              <p className="text-[11px] text-zinc-600">
                No position yet — enter Believe or Cope below.
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!position ? (
              <>
                <button
                  type="button"
                  onClick={() => enterPosition("believe")}
                  className="rounded-full border border-emerald-900/40 px-4 py-1.5 text-xs font-medium text-emerald-400/85 transition-colors hover:border-emerald-700/50 hover:bg-emerald-950/25 hover:text-emerald-300"
                >
                  Enter Believe
                </button>
                <button
                  type="button"
                  onClick={() => enterPosition("cope")}
                  className="rounded-full border border-rose-900/40 px-4 py-1.5 text-xs font-medium text-rose-400/85 transition-colors hover:border-rose-700/50 hover:bg-rose-950/25 hover:text-rose-300"
                >
                  Enter Cope
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={increasePosition}
                  className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800/50"
                >
                  Increase {position.side === "believe" ? "Believe" : "Cope"}
                </button>
                <button
                  type="button"
                  onClick={exitPosition}
                  className="rounded-full border border-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                >
                  Exit position
                </button>
              </>
            )}
          </div>
        </>
      )}

      {closed && position && (
        <div className="mt-3">
          <PositionCard position={position} />
          <p className="mt-2 text-[11px] text-zinc-600">
            Position locked — market has closed.
          </p>
        </div>
      )}
    </section>
  );
}
