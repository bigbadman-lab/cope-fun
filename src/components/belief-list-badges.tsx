import type { VoteChoice } from "@/lib/vote";
import type { SavedConversation } from "@/lib/saved-chats";

type BeliefBadgesProps = {
  hasMarket?: boolean;
  userVote?: VoteChoice | null;
};

const badgeBase =
  "rounded-full px-2 py-0.5 text-[10px] font-medium leading-none";

const marketLiveBadge = [
  badgeBase,
  "border border-emerald-300/70 bg-emerald-100 text-emerald-800",
  "dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400/85",
].join(" ");

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

export function BeliefBadges({ hasMarket = false, userVote = null }: BeliefBadgesProps) {
  if (!hasMarket && userVote == null) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {hasMarket && <span className={marketLiveBadge}>Market Live</span>}
      {userVote === "believe" && <span className={believeBadge}>Believe</span>}
      {userVote === "cope" && <span className={copeBadge}>Cope</span>}
    </div>
  );
}

type BeliefListBadgesProps = {
  conversation: SavedConversation;
};

export function BeliefListBadges({ conversation }: BeliefListBadgesProps) {
  return (
    <BeliefBadges
      hasMarket={false}
      userVote={conversation.userVote ?? null}
    />
  );
}
