function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 16V4" />
      <path d="M8 8h8" />
      <path d="M9.5 16h5" />
      <path d="M12 16v3.5" />
    </svg>
  );
}

type PinnedBeliefProps = {
  text: string;
};

export function PinnedBelief({ text }: PinnedBeliefProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 border-b border-zinc-200/60 bg-background/95 px-4 pb-4 backdrop-blur-sm dark:border-white/[0.05] dark:bg-background/90">
      <div className="rounded-xl border border-zinc-200/70 bg-surface/60 px-3.5 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:border-white/[0.07] dark:bg-surface/45">
        <div className="flex items-center gap-1.5">
          <PinIcon className="size-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
            Pinned belief
          </p>
        </div>
        <p className="mt-2.5 whitespace-pre-line text-[15px] font-medium leading-relaxed tracking-[-0.01em] text-zinc-900 dark:text-zinc-50 sm:text-base">
          {text}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Being stress-tested by the Cope Engine
        </p>
      </div>
    </div>
  );
}
