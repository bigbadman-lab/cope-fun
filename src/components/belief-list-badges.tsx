import type { SavedConversation } from "@/lib/saved-chats";

type BeliefListBadgesProps = {
  conversation: SavedConversation;
};

const badgeBase =
  "rounded-full px-2 py-0.5 text-[10px] font-medium leading-none";

const believeBadge = [
  badgeBase,
  "border border-emerald-300/60 bg-emerald-50 text-emerald-700",
  "dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400/70",
].join(" ");

const copeBadge = [
  badgeBase,
  "border border-rose-300/70 bg-rose-100 text-rose-800",
  "dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400/70",
].join(" ");

/**
 * Vote badges for local conversation lists.
 * Market status is DB-backed only — see `/markets` and room market panels.
 */
export function BeliefListBadges({ conversation }: BeliefListBadgesProps) {
  const userVote = conversation.userVote ?? null;

  if (userVote == null) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {userVote === "believe" && <span className={believeBadge}>Believe</span>}
      {userVote === "cope" && <span className={copeBadge}>Cope</span>}
    </div>
  );
}
