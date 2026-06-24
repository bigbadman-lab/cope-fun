import Link from "next/link";
import { formatConversationTime } from "@/lib/saved-chats";
import type { BeliefDirectoryItem } from "@/lib/db/beliefs-directory";

type BeliefDirectoryRowProps = {
  item: BeliefDirectoryItem;
};

const baseRowLinkClass = [
  "group -mx-2 flex w-auto items-start gap-3 rounded-xl px-2 py-3.5",
  "transition-[background-color,transform] duration-300 ease-out",
  "active:scale-[0.998]",
  "sm:items-center sm:py-4",
  "hover:bg-zinc-900/[0.04] active:bg-zinc-900/[0.06] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06]",
].join(" ");

function formatVoteSummary(item: BeliefDirectoryItem): string {
  const total = item.believeCount + item.copeCount;
  if (total === 0) return "No votes yet";
  return `Believe ${item.believePct}% · Cope ${item.copePct}%`;
}

function formatChallengeSummary(challengeCount: number): string {
  if (challengeCount === 1) return "1 challenge";
  return `${challengeCount} challenges`;
}

export function BeliefDirectoryRow({ item }: BeliefDirectoryRowProps) {
  return (
    <div className="border-b border-zinc-200/60 last:border-b-0 dark:border-white/[0.06]">
      <Link href={`/room/${item.slug}`} className={baseRowLinkClass}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-900 transition-colors duration-300 ease-out group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
              {item.belief}
            </p>
            <span className="shrink-0 text-xs text-zinc-500 transition-colors duration-300 ease-out group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
              {formatConversationTime(item.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 transition-colors duration-300 ease-out group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
            {formatChallengeSummary(item.challengeCount)} · {formatVoteSummary(item)}
          </p>
        </div>
      </Link>
    </div>
  );
}
