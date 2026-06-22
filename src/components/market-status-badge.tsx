import type { MarketStatus } from "@/lib/market-types";

const statusLabels: Record<MarketStatus, string> = {
  open: "Open",
  closed: "Closed",
  resolved: "Resolved",
  voided: "Voided",
};

const statusClasses: Record<MarketStatus, string> = {
  open:
    "border-emerald-300/50 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400/85",
  closed:
    "border-zinc-200/80 bg-surface/70 text-zinc-600 dark:border-white/[0.08] dark:bg-surface/50 dark:text-zinc-400",
  resolved:
    "border-blue-300/50 bg-blue-50/80 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300/85",
  voided:
    "border-amber-300/50 bg-amber-50/80 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300/85",
};

type MarketStatusBadgeProps = {
  status: MarketStatus;
};

export function MarketStatusBadge({ status }: MarketStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
