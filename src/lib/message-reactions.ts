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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seedMessageReactionCounts(
  scopeKey: string,
  messageId: string,
): MessageReactionCounts {
  const base = hashString(`${scopeKey}:${messageId}`);

  return {
    smart: base % 8,
    convincing: (base >> 3) % 12,
    not_sure: (base >> 6) % 5,
    cope: (base >> 9) % 6,
  };
}

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
