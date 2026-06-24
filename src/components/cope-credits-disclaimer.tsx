import { COPE_CREDITS_DISCLAIMER } from "@/lib/markets/display-status";

export function CopeCreditsDisclaimer() {
  return (
    <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
      {COPE_CREDITS_DISCLAIMER}
    </p>
  );
}
