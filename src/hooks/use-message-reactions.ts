"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyReactionChange,
  seedMessageReactionCounts,
  type MessageReactionCounts,
  type ReactionType,
} from "@/lib/message-reactions";

const COPE_SHAKE_MS = 450;

type ReactionsState = {
  countsByMessage: Record<string, MessageReactionCounts>;
  userReactions: Record<string, ReactionType | null>;
};

export function useMessageReactions(scopeKey: string, messageIds: string[]) {
  const [state, setState] = useState<ReactionsState>({
    countsByMessage: {},
    userReactions: {},
  });
  const [shakeMessageId, setShakeMessageId] = useState<string | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState((prev) => {
      const nextCounts = { ...prev.countsByMessage };
      let changed = false;

      for (const messageId of messageIds) {
        if (!nextCounts[messageId]) {
          nextCounts[messageId] = seedMessageReactionCounts(
            scopeKey,
            messageId,
          );
          changed = true;
        }
      }

      return changed ? { ...prev, countsByMessage: nextCounts } : prev;
    });
  }, [scopeKey, messageIds]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const react = useCallback(
    (messageId: string, reaction: ReactionType) => {
      setState((prev) => {
        const currentCounts =
          prev.countsByMessage[messageId] ??
          seedMessageReactionCounts(scopeKey, messageId);
        const currentUserReaction = prev.userReactions[messageId] ?? null;
        const { counts, userReaction } = applyReactionChange(
          currentCounts,
          currentUserReaction,
          reaction,
        );

        if (reaction === "cope" && userReaction === "cope") {
          if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
          setShakeMessageId(messageId);
          shakeTimerRef.current = setTimeout(
            () => setShakeMessageId(null),
            COPE_SHAKE_MS,
          );
        }

        return {
          countsByMessage: {
            ...prev.countsByMessage,
            [messageId]: counts,
          },
          userReactions: {
            ...prev.userReactions,
            [messageId]: userReaction,
          },
        };
      });
    },
    [scopeKey],
  );

  const getCounts = useCallback(
    (messageId: string) =>
      state.countsByMessage[messageId] ??
      seedMessageReactionCounts(scopeKey, messageId),
    [state.countsByMessage, scopeKey],
  );

  const getUserReaction = useCallback(
    (messageId: string) => state.userReactions[messageId] ?? null,
    [state.userReactions],
  );

  const isShaking = useCallback(
    (messageId: string) => shakeMessageId === messageId,
    [shakeMessageId],
  );

  return { getCounts, getUserReaction, react, isShaking };
}
