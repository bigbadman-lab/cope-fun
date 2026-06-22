"use client";

import { useMemo, useState } from "react";
import type { ConvictionNote, MarketSide } from "@/lib/market-types";

type NotesFilter = "all" | MarketSide;

type ConvictionNotesFeedProps = {
  notes: ConvictionNote[];
  defaultCollapsed?: boolean;
};

const filters: { id: NotesFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "believe", label: "Believe" },
  { id: "cope", label: "Cope" },
];

function formatNoteTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function SidePill({ side }: { side: MarketSide }) {
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

export function ConvictionNotesFeed({
  notes,
  defaultCollapsed = false,
}: ConvictionNotesFeedProps) {
  const [filter, setFilter] = useState<NotesFilter>("all");
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const filteredNotes = useMemo(
    () => notes.filter((note) => filter === "all" || note.side === filter),
    [filter, notes],
  );
  const noteCountLabel = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  return (
    <section className="border-t border-zinc-200/70 pt-3 dark:border-white/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Conviction Notes
          </h3>
          <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            {noteCountLabel} tied to market stakes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-zinc-200/80 bg-background/70 px-3 text-[12px] font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:border-white/[0.08] dark:bg-background/35 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            Reasons from users backing Believe or Cope.
          </p>

          <div className="mt-3 inline-flex rounded-full border border-zinc-200/80 bg-zinc-50/80 p-0.5 dark:border-white/[0.07] dark:bg-surface/70">
            {filters.map((item) => {
              const selected = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selected
                      ? "bg-background text-zinc-900 shadow-sm dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {filteredNotes.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-200/80 bg-surface/40 px-3.5 py-3 text-center text-[13px] leading-relaxed text-zinc-500 dark:border-white/[0.07] dark:bg-surface/30">
              No notes yet. Stake credits to add one.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-xl border border-zinc-200/70 bg-background/70 px-3.5 py-3 dark:border-white/[0.06] dark:bg-background/45"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-surface text-xs font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-surface/70">
                      {note.userAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={note.userAvatar}
                          alt=""
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        note.userName.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {note.userName}
                        </p>
                        <SidePill side={note.side} />
                        <span className="text-[11px] text-zinc-500">
                          {note.stakeAmount.toLocaleString()} credits
                        </span>
                        <span className="ml-auto text-[11px] text-zinc-500">
                          {formatNoteTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {note.body}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
