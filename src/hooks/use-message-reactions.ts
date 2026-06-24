"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAnonymousSessionToken } from "@/lib/anonymous-token";
import {
  applyReactionChange,
  EMPTY_REACTION_COUNTS,
  seedMessageReactionCounts,
  type MessageReactionCounts,
  type ReactionType,
} from "@/lib/message-reactions";

const COPE_SHAKE_MS = 450;

type ReactionsState = {
  countsByMessage: Record<string, MessageReactionCounts>;
  userReactions: Record<string, ReactionType | null>;
};

type MessageReactionApiResponse = {
  ok: boolean;
  counts?: MessageReactionCounts;
  userReaction?: ReactionType | null;
  error?: string;
};

type RoomReactionsApiResponse = {
  ok: boolean;
  messages?: Record<
    string,
    { counts: MessageReactionCounts; userReaction: ReactionType | null }
  >;
  error?: string;
};

type UseMessageReactionsOptions = {
  dbBacked?: boolean;
};

function emptyCounts(): MessageReactionCounts {
  return { ...EMPTY_REACTION_COUNTS };
}

export function useMessageReactions(
  scopeKey: string,
  messageIds: string[],
  options: UseMessageReactionsOptions = {},
) {
  const { dbBacked = false } = options;
  const [state, setState] = useState<ReactionsState>({
    countsByMessage: {},
    userReactions: {},
  });
  const [shakeMessageId, setShakeMessageId] = useState<string | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dbBacked) return;

    let cancelled = false;

    async function loadReactions() {
      try {
        const token = getAnonymousSessionToken();
        const response = await fetch(
          `/api/rooms/${encodeURIComponent(scopeKey)}/reactions?anonymousToken=${encodeURIComponent(token)}`,
        );
        if (!response.ok || cancelled) return;

        const result = (await response.json()) as RoomReactionsApiResponse;
        if (!result.ok || !result.messages || cancelled) return;

        const countsByMessage: Record<string, MessageReactionCounts> = {};
        const userReactions: Record<string, ReactionType | null> = {};

        for (const [messageId, reactionState] of Object.entries(
          result.messages,
        )) {
          countsByMessage[messageId] = reactionState.counts;
          userReactions[messageId] = reactionState.userReaction;
        }

        setState({ countsByMessage, userReactions });
      } catch {
        // Keep empty reaction state if hydration fails.
      }
    }

    void loadReactions();

    return () => {
      cancelled = true;
    };
  }, [dbBacked, scopeKey]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const triggerCopeShake = useCallback((messageId: string) => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShakeMessageId(messageId);
    shakeTimerRef.current = setTimeout(
      () => setShakeMessageId(null),
      COPE_SHAKE_MS,
    );
  }, []);

  const react = useCallback(
    async (messageId: string, reaction: ReactionType) => {
      if (dbBacked) {
        if (pendingMessageId === messageId) return;

        setPendingMessageId(messageId);
        try {
          const response = await fetch(
            `/api/rooms/${encodeURIComponent(scopeKey)}/messages/${encodeURIComponent(messageId)}/reaction`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reaction,
                anonymousToken: getAnonymousSessionToken(),
              }),
            },
          );

          if (!response.ok) return;

          const result = (await response.json()) as MessageReactionApiResponse;
          if (!result.ok || !result.counts) return;

          setState((prev) => ({
            countsByMessage: {
              ...prev.countsByMessage,
              [messageId]: result.counts!,
            },
            userReactions: {
              ...prev.userReactions,
              [messageId]: result.userReaction ?? null,
            },
          }));

          if (reaction === "cope" && result.userReaction === "cope") {
            triggerCopeShake(messageId);
          }
        } catch {
          // Leave current state unchanged on failure.
        } finally {
          setPendingMessageId(null);
        }
        return;
      }

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
          triggerCopeShake(messageId);
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
    [dbBacked, pendingMessageId, scopeKey, triggerCopeShake],
  );

  const getCounts = useCallback(
    (messageId: string) => {
      if (state.countsByMessage[messageId]) {
        return state.countsByMessage[messageId];
      }

      return dbBacked
        ? emptyCounts()
        : seedMessageReactionCounts(scopeKey, messageId);
    },
    [dbBacked, scopeKey, state.countsByMessage],
  );

  const getUserReaction = useCallback(
    (messageId: string) => state.userReactions[messageId] ?? null,
    [state.userReactions],
  );

  const isShaking = useCallback(
    (messageId: string) => shakeMessageId === messageId,
    [shakeMessageId],
  );

  const isPending = useCallback(
    (messageId: string) => pendingMessageId === messageId,
    [pendingMessageId],
  );

  return { getCounts, getUserReaction, react, isShaking, isPending };
}
