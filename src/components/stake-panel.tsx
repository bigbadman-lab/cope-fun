"use client";

import { useState } from "react";
import type { MarketPosition, MarketSide } from "@/lib/market-types";

type StakePanelProps = {
  balance?: number;
  disabled?: boolean;
  position: MarketPosition | null;
  onStake: (input: {
    side: MarketSide;
    stakeAmount: number;
    noteBody: string;
  }) => void;
};

const DEFAULT_BALANCE = 1_000;

function SideButton({
  side,
  selected,
  onSelect,
}: {
  side: MarketSide;
  selected: boolean;
  onSelect: (side: MarketSide) => void;
}) {
  const isBelieve = side === "believe";

  return (
    <button
      type="button"
      onClick={() => onSelect(side)}
      aria-pressed={selected}
      className={`min-h-11 flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors md:min-h-0 ${
        selected
          ? isBelieve
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
            : "border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          : "border-zinc-200/80 bg-background/70 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-background/40 dark:text-zinc-400 dark:hover:border-white/15 dark:hover:text-zinc-200"
      }`}
    >
      {isBelieve ? "Believe" : "Cope"}
    </button>
  );
}

export function StakePanel({
  balance = DEFAULT_BALANCE,
  disabled = false,
  position,
  onStake,
}: StakePanelProps) {
  const [side, setSide] = useState<MarketSide | null>(position?.side ?? null);
  const [amount, setAmount] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);
    if (!side) {
      setError("Choose Believe or Cope first.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a stake greater than 0.");
      return;
    }
    if (parsedAmount > balance) {
      setError("Stake amount exceeds your mock balance.");
      return;
    }

    onStake({
      side,
      stakeAmount: Math.floor(parsedAmount),
      noteBody: noteBody.trim(),
    });
    setAmount("");
    setNoteBody("");
    setSuccess("Stake recorded locally for this demo.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200/70 bg-background/65 px-3.5 py-3.5 dark:border-white/[0.06] dark:bg-background/35"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Stake COPE Credits
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            Back your conviction. Your note becomes public if you add one.
          </p>
        </div>
        <p className="rounded-full border border-zinc-200/70 bg-background/70 px-2.5 py-1 text-[11px] text-zinc-500 dark:border-white/[0.07] dark:bg-background/40">
          {balance.toLocaleString()} credits
        </p>
      </div>

      {success && (
        <p className="mt-3 rounded-lg border border-emerald-300/50 bg-emerald-50/70 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-900/35 dark:bg-emerald-950/15 dark:text-emerald-400" role="status">
          {success}
        </p>
      )}

      {position && (
        <p className="mt-3 rounded-xl border border-zinc-200/70 bg-background/60 px-3 py-2 text-[12px] text-zinc-600 dark:border-white/[0.06] dark:bg-background/35 dark:text-zinc-400">
          Current position:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {position.side === "believe" ? "Believe" : "Cope"}
          </span>{" "}
          with {position.stakeAmount.toLocaleString()} credits.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SideButton
          side="believe"
          selected={side === "believe"}
          onSelect={setSide}
        />
        <SideButton side="cope" selected={side === "cope"} onSelect={setSide} />
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Stake amount
        </span>
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled}
          placeholder="100"
          className="min-h-11 w-full rounded-xl border border-zinc-200/80 bg-background/70 px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/[0.08] dark:bg-background/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-white/20"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          <span>Optional conviction note</span>
          <span className="normal-case tracking-normal text-zinc-400">
            Published with your stake
          </span>
        </span>
        <textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="Explain your conviction..."
          className="w-full resize-none rounded-xl border border-zinc-200/80 bg-surface/55 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/[0.08] dark:bg-surface/35 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-white/20"
        />
        <span className="mt-1.5 block text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Your note is published with your stake.
        </span>
      </label>

      {error && (
        <p className="mt-3 text-[12px] text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cope-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-cope-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Stake Credits
      </button>
    </form>
  );
}
