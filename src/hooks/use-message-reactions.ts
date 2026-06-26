"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyReactionChange,
  EMPTY_REACTION_COUNTS,
  type MessageReactionCounts,
  type ReactionType,
} from "@/lib/message-reactions";

const COPE_SHAKE_MS = 450;

export type MessageReactionsMode =
  | "disabled"
  | "read-only"
  | "interactive";

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

type AuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type UseMessageReactionsOptions = {
  /** Load and display reactions for a persisted DB room. */
  enabled?: boolean;
  authenticated?: boolean;
  authReady?: boolean;
  authFetch?: AuthFetch;
};

function emptyCounts(): MessageReactionCounts {
  return { ...EMPTY_REACTION_COUNTS };
}

export function useMessageReactions(
  roomSlug: string,
  options: UseMessageReactionsOptions = {},
) {
  const {
    enabled = false,
    authenticated = false,
    authReady = true,
    authFetch,
  } = options;

  const [state, setState] = useState<ReactionsState>({
    countsByMessage: {},
    userReactions: {},
  });
  const [signInRequired, setSignInRequired] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [shakeMessageId, setShakeMessageId] = useState<string | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authFetchRef = useRef(authFetch);

  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  useEffect(() => {
    if (!enabled || !authReady) return;

    let cancelled = false;

    async function loadReactions() {
      try {
        const url = `/api/rooms/${encodeURIComponent(roomSlug)}/reactions`;
        const fetcher =
          authenticated && authFetchRef.current
            ? authFetchRef.current
            : fetch;
        const response = await fetcher(url);

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
        // Keep zero counts if hydration fails.
      }
    }

    void loadReactions();

    return () => {
      cancelled = true;
    };
  }, [authenticated, authReady, enabled, roomSlug]);

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
      if (!enabled) return;

      if (!authenticated || !authFetchRef.current) {
        setSignInRequired(true);
        return;
      }

      if (pendingMessageId === messageId) return;

      const previousCounts = state.countsByMessage[messageId] ?? emptyCounts();
      const previousUserReaction = state.userReactions[messageId] ?? null;
      const optimistic = applyReactionChange(
        previousCounts,
        previousUserReaction,
        reaction,
      );

      setSignInRequired(false);
      setReactionError(null);
      setState((prev) => ({
        countsByMessage: {
          ...prev.countsByMessage,
          [messageId]: optimistic.counts,
        },
        userReactions: {
          ...prev.userReactions,
          [messageId]: optimistic.userReaction,
        },
      }));

      if (reaction === "cope" && optimistic.userReaction === "cope") {
        triggerCopeShake(messageId);
      }

      setPendingMessageId(messageId);

      try {
        const response = await authFetchRef.current!(
          `/api/rooms/${encodeURIComponent(roomSlug)}/messages/${encodeURIComponent(messageId)}/reaction`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reaction }),
          },
        );

        const result = (await response.json()) as MessageReactionApiResponse;

        if (response.status === 401) {
          setState((prev) => ({
            countsByMessage: {
              ...prev.countsByMessage,
              [messageId]: previousCounts,
            },
            userReactions: {
              ...prev.userReactions,
              [messageId]: previousUserReaction,
            },
          }));
          setSignInRequired(true);
          return;
        }

        if (!response.ok || !result.ok || !result.counts) {
          setState((prev) => ({
            countsByMessage: {
              ...prev.countsByMessage,
              [messageId]: previousCounts,
            },
            userReactions: {
              ...prev.userReactions,
              [messageId]: previousUserReaction,
            },
          }));
          setReactionError(result.error ?? "Could not save reaction.");
          return;
        }

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
        setState((prev) => ({
          countsByMessage: {
            ...prev.countsByMessage,
            [messageId]: previousCounts,
          },
          userReactions: {
            ...prev.userReactions,
            [messageId]: previousUserReaction,
          },
        }));
        setReactionError("Could not save reaction.");
      } finally {
        setPendingMessageId(null);
      }
    },
    [
      authenticated,
      enabled,
      pendingMessageId,
      roomSlug,
      state.countsByMessage,
      state.userReactions,
      triggerCopeShake,
    ],
  );

  const getCounts = useCallback(
    (messageId: string) =>
      enabled
        ? (state.countsByMessage[messageId] ?? emptyCounts())
        : emptyCounts(),
    [enabled, state.countsByMessage],
  );

  const getUserReaction = useCallback(
    (messageId: string) =>
      enabled ? (state.userReactions[messageId] ?? null) : null,
    [enabled, state.userReactions],
  );

  const isShaking = useCallback(
    (messageId: string) => shakeMessageId === messageId,
    [shakeMessageId],
  );

  const isPending = useCallback(
    (messageId: string) => pendingMessageId === messageId,
    [pendingMessageId],
  );

  const clearSignInRequired = useCallback(() => {
    setSignInRequired(false);
  }, []);

  let mode: MessageReactionsMode = "disabled";
  if (enabled) {
    if (authenticated && authReady) mode = "interactive";
    else mode = "read-only";
  }

  const clearReactionError = useCallback(() => {
    setReactionError(null);
  }, []);

  return {
    mode,
    signInRequired,
    reactionError,
    clearSignInRequired,
    clearReactionError,
    getCounts,
    getUserReaction,
    react,
    isShaking,
    isPending,
  };
}
