import type { VoteChoice } from "@/lib/vote";
import type { SavedConversation } from "@/lib/saved-chats";

type BeliefBadgesProps = {
  hasMarket?: boolean;
  userVote?: VoteChoice | null;
};

export function BeliefBadges({ hasMarket = false, userVote = null }: BeliefBadgesProps) {
  if (!hasMarket && userVote == null) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {hasMarket && (
        <span className="rounded-full border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400/85">
          Market Live
        </span>
      )}
      {userVote === "believe" && (
        <span className="rounded-full border border-emerald-900/30 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400/70">
          Believe
        </span>
      )}
      {userVote === "cope" && (
        <span className="rounded-full border border-rose-900/30 bg-rose-950/20 px-2 py-0.5 text-[10px] font-medium text-rose-400/70">
          Cope
        </span>
      )}
    </div>
  );
}

type BeliefListBadgesProps = {
  conversation: SavedConversation;
};

export function BeliefListBadges({ conversation }: BeliefListBadgesProps) {
  return (
    <BeliefBadges
      hasMarket={conversation.market != null}
      userVote={conversation.userVote ?? null}
    />
  );
}
