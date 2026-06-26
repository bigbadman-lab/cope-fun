export type ReactionType = "smart" | "convincing" | "not_sure" | "cope";

export type MessageReactionCounts = Record<ReactionType, number>;

export const REACTION_OPTIONS: {
  id: ReactionType;
  emoji: string;
  label: string;
}[] = [
  { id: "smart", emoji: "🧠", label: "Smart" },
  { id: "convincing", emoji: "🔥", label: "Convincing" },
  { id: "not_sure", emoji: "🤔", label: "Not Sure" },
  { id: "cope", emoji: "💀", label: "Cope" },
];

export const EMPTY_REACTION_COUNTS: MessageReactionCounts = {
  smart: 0,
  convincing: 0,
  not_sure: 0,
  cope: 0,
};

export function applyReactionChange(
  counts: MessageReactionCounts,
  currentUserReaction: ReactionType | null,
  nextReaction: ReactionType,
): { counts: MessageReactionCounts; userReaction: ReactionType | null } {
  const nextCounts = { ...counts };

  if (currentUserReaction === nextReaction) {
    nextCounts[nextReaction] = Math.max(0, nextCounts[nextReaction] - 1);
    return { counts: nextCounts, userReaction: null };
  }

  if (currentUserReaction) {
    nextCounts[currentUserReaction] = Math.max(
      0,
      nextCounts[currentUserReaction] - 1,
    );
  }

  nextCounts[nextReaction] += 1;
  return { counts: nextCounts, userReaction: nextReaction };
}
