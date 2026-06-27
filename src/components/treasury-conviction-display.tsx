import { formatWholeAmount } from "@/lib/markets/format-amount";

type TreasuryConvictionDisplayProps = {
  amount: number;
  variant?: "inline" | "panel";
};

export function TreasuryConvictionDisplay({
  amount,
  variant = "inline",
}: TreasuryConvictionDisplayProps) {
  if (amount <= 0) return null;

  if (variant === "panel") {
    return (
      <div className="mt-3 rounded-lg border border-cope-orange/20 bg-cope-orange/[0.06] px-3 py-2.5 dark:border-cope-orange/25 dark:bg-cope-orange/[0.08]">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-cope-orange/90">
          Treasury Conviction
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatWholeAmount(amount)} $COPE
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Protocol incentive signal for this market. Does not affect COPE Credit
          staking or settlement.
        </p>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cope-orange/25 bg-cope-orange/[0.07] px-2 py-0.5 text-[11px] font-medium text-cope-orange dark:border-cope-orange/30 dark:bg-cope-orange/[0.1]">
      <span className="uppercase tracking-[0.08em]">Treasury Conviction</span>
      <span aria-hidden>·</span>
      <span className="tabular-nums">{formatWholeAmount(amount)} $COPE</span>
    </span>
  );
}
