"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BelieveCopeVote } from "./believe-cope-vote";
import { BeliefInput } from "./belief-input";
import { PinnedBelief } from "./pinned-belief";
import { PinnedMarketHeader } from "./pinned-market-header";
import { PulseRoomChat } from "./pulse/pulse-room-chat";
import { PulseRoomHeader } from "./pulse/pulse-room-header";
import { RoomMarketPanel } from "./room-market-panel";
import { RoomConclusionPanel } from "./room-bottom-panel";
import { RoomComposerShell } from "./room-composer-shell";
import {
  AgentTurnRow,
  ChatMessageRow,
  GroupFormationMessage,
  type ChatMessage,
  type MessageReactionProps,
} from "./debate-chat";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";
import { REACTIONS_ENABLED } from "@/lib/features";
import { isRoomCreator } from "@/lib/room-creator";
import {
  buildFollowUpResponse,
  createFollowUpAgentMessage,
  createFollowUpUserMessage,
  getAgentTypingDelayMs,
  getGapBetweenAgentsMs,
  getInitialFollowUpTypingDelayMs,
  isAttentionChallengeMessage,
  pickRespondingAgents,
  validateFollowUpDraft,
} from "@/lib/room-follow-up";
import {
  applyVoteChange,
  seedVoteCounts,
  type VoteChoice,
} from "@/lib/vote";
import { useAppAuth } from "@/hooks/use-app-auth";
import { getAnonymousSessionToken } from "@/lib/anonymous-token";
import { readRateLimitMessage } from "@/lib/rate-limit/client";
import {
  claimRoomCreatorIfUnassigned,
  updateSavedConversation,
  type SavedConversation,
} from "@/lib/saved-chats";
import type { RoomMarketView } from "@/lib/markets/types";
import { PULSE_BELIEF_ROOM_ID } from "@/lib/pulse/constants";
import type { PulseStatusResponse } from "./pulse/use-pulse-room";

type SavedChatViewProps = {
  conversation: SavedConversation;
  dbBacked?: boolean;
  initialMarket?: RoomMarketView | null;
  initialPulseStatus?: PulseStatusResponse | null;
};

type RoomVoteApiResponse = {
  ok: boolean;
  believeCount?: number;
  copeCount?: number;
  userVote?: VoteChoice | null;
  error?: string;
};

type RoomCreatorApiResponse = {
  ok: boolean;
  isCreator?: boolean;
  error?: string;
};

type RoomChallengeApiResponse = {
  ok: boolean;
  room?: SavedConversation;
  agentReplies?: ChatMessage[];
  agents?: string[];
  attentionRemaining?: number;
  error?: string;
};

type LiveAgentTurn = {
  author: string;
  mode: "typing" | "fading" | "message";
  text: string;
};

type FollowUpApiResponse = {
  ok: boolean;
  belief: string;
  followUp: string;
  messages: ChatMessage[];
  agents: string[];
  error?: string;
};

type ChallengeProcessingStage = "submitting" | "responding";

const CHALLENGE_PROCESSING_LABELS: Record<ChallengeProcessingStage, string> = {
  submitting: "Sending challenge…",
  responding: "Agents are reconsidering your challenge…",
};

function ChallengeProcessingStatus({
  stage,
}: {
  stage: ChallengeProcessingStage;
}) {
  return (
    <p
      className="mb-2 flex min-h-5 items-center justify-center gap-2 text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
      role="status"
      aria-live="polite"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-cope-orange animate-pulse" />
      <span key={stage} className="animate-message-in">
        {CHALLENGE_PROCESSING_LABELS[stage]}
      </span>
    </p>
  );
}

export function SavedChatView({
  conversation: initialConversation,
  dbBacked = false,
  initialMarket = null,
  initialPulseStatus = null,
}: SavedChatViewProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const [roomMarket, setRoomMarket] = useState<RoomMarketView | null>(
    initialMarket,
  );
  const { ready, authenticated, authFetch, login } = useAppAuth();
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [isChallengeSubmitting, setIsChallengeSubmitting] = useState(false);
  const [liveTurn, setLiveTurn] = useState<LiveAgentTurn | null>(null);
  const [isAgentRoundActive, setIsAgentRoundActive] = useState(false);
  const [isCreatorForViewer, setIsCreatorForViewer] = useState<boolean | null>(
    dbBacked ? null : false,
  );
  // Mobile-only Pulse header collapse, driven by chat scroll. Desktop ignores
  // this via responsive classes inside PulseRoomHeader.
  const [pulseHeaderCollapsed, setPulseHeaderCollapsed] = useState(false);
  const pulseCollapseSuppressRef = useRef(0);

  const handlePulseChatScroll = useCallback((scrollTop: number) => {
    if (Date.now() < pulseCollapseSuppressRef.current) return;
    setPulseHeaderCollapsed((prev) => {
      if (!prev && scrollTop > 56) return true;
      if (prev && scrollTop <= 4) return false;
      return prev;
    });
  }, []);

  const handleExpandPulseHeader = useCallback(() => {
    setPulseHeaderCollapsed(false);
    // Ignore the reflow scroll caused by the header growing back.
    pulseCollapseSuppressRef.current = Date.now() + 500;
  }, []);
  const roundTimersRef = useRef<number[]>([]);
  const debateBodyRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const followUpInputRef = useRef<HTMLTextAreaElement>(null);

  const belief = conversation.belief;
  const messages = conversation.messages;
  const isPulseRoom = conversation.id === PULSE_BELIEF_ROOM_ID;
  const isCreatorStatusKnown = !dbBacked || isCreatorForViewer !== null;
  const isCreator = dbBacked
    ? isCreatorForViewer === true
    : isRoomCreator(conversation.creatorId);
  const showCreatorBottomPanel = isCreatorStatusKnown && isCreator && !isPulseRoom;
  const pinnedBeliefIsCreator =
    dbBacked && isCreatorForViewer === null ? undefined : isCreator;
  const attentionRemaining = conversation.attentionRemaining;
  const canSendFollowUp =
    isCreator &&
    attentionRemaining > 0 &&
    !isAgentRoundActive &&
    !isChallengeSubmitting;
  const challengeProcessingStage: ChallengeProcessingStage | null =
    isChallengeSubmitting
      ? "submitting"
      : isAgentRoundActive
        ? "responding"
        : null;

  const resetChallengeSubmit = useCallback(() => {
    setIsChallengeSubmitting(false);
    setIsAgentRoundActive(false);
    requestAnimationFrame(() => {
      followUpInputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setConversation(initialConversation);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialConversation]);

  useEffect(() => {
    if (dbBacked) return;
    if (initialConversation.creatorId) return;
    const frame = requestAnimationFrame(() => {
      const claimed = claimRoomCreatorIfUnassigned(initialConversation.slug);
      if (claimed) setConversation(claimed);
    });
    return () => cancelAnimationFrame(frame);
  }, [dbBacked, initialConversation.slug, initialConversation.creatorId]);

  useEffect(() => {
    if (!dbBacked) return;

    let cancelled = false;

    async function loadCreatorStatus() {
      setIsCreatorForViewer(null);

      try {
        const token = getAnonymousSessionToken();
        const response = await fetch(
          `/api/rooms/${encodeURIComponent(conversation.slug)}/creator?anonymousToken=${encodeURIComponent(token)}`,
        );
        if (cancelled) return;

        if (!response.ok) {
          setIsCreatorForViewer(false);
          return;
        }

        const result = (await response.json()) as RoomCreatorApiResponse;
        if (cancelled) return;

        setIsCreatorForViewer(result.ok && result.isCreator === true);
      } catch {
        if (!cancelled) setIsCreatorForViewer(false);
      }
    }

    void loadCreatorStatus();

    return () => {
      cancelled = true;
    };
  }, [conversation.slug, dbBacked]);

  useEffect(() => {
    if (!dbBacked) return;

    let cancelled = false;

    async function loadRoomMarket() {
      try {
        const token = getAnonymousSessionToken();
        const url = authenticated
          ? `/api/rooms/${encodeURIComponent(conversation.slug)}/market`
          : `/api/rooms/${encodeURIComponent(conversation.slug)}/market?anonymousToken=${encodeURIComponent(token)}`;
        const response = authenticated
          ? await authFetch(url)
          : await fetch(url);
        if (!response.ok || cancelled) return;

        const result = (await response.json()) as {
          ok: boolean;
          market?: RoomMarketView | null;
        };
        if (!result.ok || cancelled) return;

        setRoomMarket(result.market ?? null);
      } catch {
        // Keep server-provided market snapshot if refresh fails.
      }
    }

    void loadRoomMarket();

    return () => {
      cancelled = true;
    };
  }, [conversation.slug, dbBacked, ready, authenticated, authFetch]);

  useEffect(() => {
    debateBodyRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [initialConversation.slug]);

  useEffect(() => {
    return () => {
      roundTimersRef.current.forEach(clearTimeout);
      roundTimersRef.current = [];
    };
  }, []);

  const seededCounts = useMemo(() => seedVoteCounts(belief), [belief]);
  const initialBelieveCount = dbBacked
    ? (conversation.believeCount ?? 0)
    : (conversation.believeCount ?? seededCounts.believeCount);
  const initialCopeCount = dbBacked
    ? (conversation.copeCount ?? 0)
    : (conversation.copeCount ?? seededCounts.copeCount);

  const [localBelieveCount, setLocalBelieveCount] = useState(initialBelieveCount);
  const [localCopeCount, setLocalCopeCount] = useState(initialCopeCount);
  const [localUserVote, setLocalUserVote] = useState<VoteChoice | null>(
    dbBacked ? null : (conversation.userVote ?? null),
  );
  const [isVotePending, setIsVotePending] = useState(false);

  useEffect(() => {
    if (!dbBacked) return;

    let cancelled = false;

    async function loadVoteState() {
      try {
        const token = getAnonymousSessionToken();
        const response = await fetch(
          `/api/rooms/${encodeURIComponent(conversation.slug)}/vote?anonymousToken=${encodeURIComponent(token)}`,
        );
        if (!response.ok || cancelled) return;

        const result = (await response.json()) as RoomVoteApiResponse;
        if (!result.ok || cancelled) return;

        setLocalBelieveCount(result.believeCount ?? 0);
        setLocalCopeCount(result.copeCount ?? 0);
        setLocalUserVote(result.userVote ?? null);
      } catch {
        // Keep server-rendered totals if hydration fails.
      }
    }

    void loadVoteState();

    return () => {
      cancelled = true;
    };
  }, [conversation.slug, dbBacked]);

  const handleVote = useCallback(
    async (choice: VoteChoice) => {
      if (dbBacked) {
        if (isVotePending || localUserVote === choice) return;

        setIsVotePending(true);
        try {
          const response = await fetch(
            `/api/rooms/${encodeURIComponent(conversation.slug)}/vote`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                vote: choice,
                anonymousToken: getAnonymousSessionToken(),
              }),
            },
          );

          if (!response.ok) return;

          const result = (await response.json()) as RoomVoteApiResponse;
          if (!result.ok) return;

          setLocalBelieveCount(result.believeCount ?? 0);
          setLocalCopeCount(result.copeCount ?? 0);
          setLocalUserVote(result.userVote ?? null);
        } catch {
          // Leave current state unchanged on failure.
        } finally {
          setIsVotePending(false);
        }
        return;
      }

      const next = applyVoteChange(
        {
          believeCount: localBelieveCount,
          copeCount: localCopeCount,
          userVote: localUserVote,
        },
        choice,
      );
      setLocalBelieveCount(next.believeCount);
      setLocalCopeCount(next.copeCount);
      setLocalUserVote(next.userVote);
    },
    [
      conversation.slug,
      dbBacked,
      isVotePending,
      localBelieveCount,
      localCopeCount,
      localUserVote,
    ],
  );

  const beliefMessage = messages.find((message) => message.isUser);
  const threadMessages = messages.filter(
    (message) => !message.isUser || message.id !== beliefMessage?.id,
  );

  const {
    mode: reactionsMode,
    signInRequired: reactionsSignInRequired,
    reactionError,
    clearSignInRequired,
    getCounts,
    getUserReaction,
    react,
    isShaking,
    isPending,
  } = useMessageReactions(conversation.slug, {
    enabled: dbBacked && REACTIONS_ENABLED,
    authenticated,
    authReady: ready,
    authFetch,
  });

  const getReactionProps = useCallback(
    (messageId: string): MessageReactionProps | undefined => {
      if (!REACTIONS_ENABLED || !dbBacked) return undefined;

      return {
        counts: getCounts(messageId),
        userReaction: getUserReaction(messageId),
        onReact: isPending(messageId)
          ? () => {}
          : (reaction) => {
              void react(messageId, reaction);
            },
        copeShake: isShaking(messageId),
        interactive: reactionsMode === "interactive",
        onSignInRequired: () => {
          clearSignInRequired();
          login();
        },
        showSignInHint: reactionsSignInRequired && reactionsMode === "read-only",
      };
    },
    [
      clearSignInRequired,
      dbBacked,
      getCounts,
      getUserReaction,
      isPending,
      isShaking,
      login,
      react,
      reactionsMode,
      reactionsSignInRequired,
    ],
  );

  const scheduleRoundTimer = useCallback((fn: () => void, delay: number) => {
    const timer = window.setTimeout(fn, delay);
    roundTimersRef.current.push(timer);
  }, []);

  const scrollToEnd = useCallback(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, liveTurn, scrollToEnd]);

  const getFallbackFollowUpReplies = useCallback(
    (followUpText: string): ChatMessage[] =>
      pickRespondingAgents(followUpText).map((agent, index) =>
        createFollowUpAgentMessage(
          agent,
          buildFollowUpResponse(agent, belief, followUpText),
          index,
        ),
      ),
    [belief],
  );

  const getFollowUpReplies = useCallback(
    async (
      followUpText: string,
      baseMessages: ChatMessage[],
      nextAttention: number,
    ): Promise<ChatMessage[]> => {
      try {
        const response = await fetch("/api/debate/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            belief,
            followUp: followUpText,
            messages: baseMessages,
            attentionRemaining: nextAttention,
            anonymousToken: getAnonymousSessionToken(),
          }),
        });

        if (response.status === 429) return getFallbackFollowUpReplies(followUpText);

        if (!response.ok) throw new Error("Follow-up request failed.");

        const result = (await response.json()) as FollowUpApiResponse;
        if (result.ok && result.messages.length >= 2) {
          return result.messages.slice(0, 3);
        }
      } catch {
        // Fall through to deterministic templates so the room flow never breaks.
      }

      return getFallbackFollowUpReplies(followUpText);
    },
    [belief, getFallbackFollowUpReplies],
  );

  const animateAgentReplies = useCallback(
    (
      agentReplies: ChatMessage[],
      baseMessages: ChatMessage[],
      finalConversation?: SavedConversation,
    ) => {
      if (agentReplies.length === 0) {
        if (finalConversation) setConversation(finalConversation);
        setIsAgentRoundActive(false);
        return;
      }

      setIsAgentRoundActive(true);
      setLiveTurn(null);

      let elapsed = getInitialFollowUpTypingDelayMs();
      let currentMessages = baseMessages;

      agentReplies.forEach((agentMessage, index) => {
        const agent = agentMessage.author;
        const typingStart = elapsed;
        const typingDuration = getAgentTypingDelayMs(agent);
        const typingFadeMs = typingStart + typingDuration - TYPING_FADE_OUT_MS;
        const messageAt = typingStart + typingDuration;

        scheduleRoundTimer(() => {
          setLiveTurn({ author: agent, mode: "typing", text: "" });
        }, typingStart);

        scheduleRoundTimer(() => {
          setLiveTurn({ author: agent, mode: "fading", text: "" });
        }, typingFadeMs);

        scheduleRoundTimer(() => {
          currentMessages = [...currentMessages, agentMessage];
          if (dbBacked) {
            setConversation((previous) => ({
              ...(finalConversation ?? previous),
              messages: currentMessages,
            }));
          } else {
            const updated = updateSavedConversation(conversation.slug, {
              messages: currentMessages,
            });
            if (updated) setConversation(updated);
          }
          setLiveTurn(null);

          if (index === agentReplies.length - 1) {
            if (finalConversation) setConversation(finalConversation);
            setIsAgentRoundActive(false);
          }
        }, messageAt);

        elapsed = messageAt + getGapBetweenAgentsMs();
      });
    },
    [conversation.slug, dbBacked, scheduleRoundTimer],
  );

  const runAgentRound = useCallback(
    async (
      followUpText: string,
      baseMessages: ChatMessage[],
      nextAttention: number,
    ) => {
      setLiveTurn(null);

      try {
        const agentReplies = await getFollowUpReplies(
          followUpText,
          baseMessages,
          nextAttention,
        );
        setIsChallengeSubmitting(false);
        animateAgentReplies(agentReplies, baseMessages);
      } catch {
        setFollowUpError("Could not submit challenge.");
        resetChallengeSubmit();
      }
    },
    [animateAgentReplies, getFollowUpReplies, resetChallengeSubmit],
  );

  const submitDbChallenge = useCallback(
    async (text: string) => {
      setLiveTurn(null);

      try {
        const clientChallengeId = crypto.randomUUID();
        const response = await fetch(
          `/api/rooms/${encodeURIComponent(conversation.slug)}/challenge`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              anonymousToken: getAnonymousSessionToken(),
              challengeText: text,
              clientChallengeId,
            }),
          },
        );

        if (response.status === 429) {
          setFollowUpError(await readRateLimitMessage(response));
          resetChallengeSubmit();
          return;
        }

        const result = (await response.json()) as RoomChallengeApiResponse;

        if (!response.ok || !result.ok || !result.room || !result.agentReplies) {
          const errorMessage =
            result.error ??
            (response.status === 403
              ? "Only the room creator can submit challenges."
              : response.status === 409
                ? "No attention remaining."
                : "Could not submit challenge.");
          setFollowUpError(errorMessage);
          resetChallengeSubmit();
          return;
        }

        const agentReplies = result.agentReplies;
        const baseMessages = result.room.messages.slice(
          0,
          result.room.messages.length - agentReplies.length,
        );

        setConversation({
          ...result.room,
          messages: baseMessages,
        });
        setFollowUpDraft("");
        setFollowUpError(null);
        setIsChallengeSubmitting(false);
        animateAgentReplies(agentReplies, baseMessages, result.room);
      } catch {
        setFollowUpError("Could not submit challenge.");
        resetChallengeSubmit();
      }
    },
    [animateAgentReplies, conversation.slug, resetChallengeSubmit],
  );

  const handleFollowUpSubmit = useCallback(() => {
    const text = followUpDraft.trim();
    if (!canSendFollowUp) return;

    const invalidMessage = validateFollowUpDraft(text);
    if (invalidMessage) {
      setFollowUpError(invalidMessage);
      return;
    }

    setIsChallengeSubmitting(true);
    setFollowUpError(null);

    if (dbBacked) {
      void submitDbChallenge(text);
      return;
    }

    const userMessage = createFollowUpUserMessage(text, messages.length);
    const nextMessages = [...messages, userMessage];
    const nextAttention = attentionRemaining - 1;

    const updated = updateSavedConversation(conversation.slug, {
      messages: nextMessages,
      attentionRemaining: nextAttention,
    });
    if (!updated) {
      setIsChallengeSubmitting(false);
      return;
    }

    setConversation(updated);
    setFollowUpDraft("");
    void runAgentRound(text, nextMessages, nextAttention);
  }, [
    attentionRemaining,
    canSendFollowUp,
    conversation.slug,
    dbBacked,
    followUpDraft,
    messages,
    runAgentRound,
    submitDbChallenge,
  ]);

  const bottomPanelHeight = isPulseRoom
    ? ""
    : showCreatorBottomPanel
      ? attentionRemaining > 0
        ? "pb-[calc(9.5rem+var(--scroll-bottom-inset))]"
        : "pb-[calc(10rem+var(--scroll-bottom-inset))]"
      : "pb-[calc(2rem+var(--scroll-bottom-inset))]";

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="room-pinned-header px-4">
          <div className="mx-auto w-full max-w-md">
            {isPulseRoom ? (
              <PulseRoomHeader
                beliefRoomId={PULSE_BELIEF_ROOM_ID}
                belief={beliefMessage?.text ?? belief}
                initialStatus={initialPulseStatus}
                collapsed={pulseHeaderCollapsed}
                onExpand={handleExpandPulseHeader}
              />
            ) : dbBacked && roomMarket ? (
              <PinnedMarketHeader market={roomMarket} />
            ) : (
              <PinnedBelief
                text={beliefMessage?.text ?? belief}
                attentionRemaining={attentionRemaining}
                isCreator={pinnedBeliefIsCreator}
              />
            )}
          </div>
        </header>

        <div
          ref={debateBodyRef}
          className={
            isPulseRoom
              ? "room-debate-body flex min-h-0 flex-col overflow-hidden"
              : "room-debate-body"
          }
        >
          {isPulseRoom ? (
            <PulseRoomChat
              beliefRoomId={PULSE_BELIEF_ROOM_ID}
              onUserScroll={handlePulseChatScroll}
            />
          ) : (
            <div className={`w-full px-4 pt-4 ${bottomPanelHeight}`}>
              <div className="relative z-0 mx-auto w-full max-w-md space-y-4">
                {dbBacked && roomMarket ? (
                  <RoomMarketPanel
                    market={roomMarket}
                    onMarketChange={setRoomMarket}
                    hideSummary
                  />
                ) : null}

                <GroupFormationMessage animate={false} />

                {REACTIONS_ENABLED && reactionError && (
                  <p
                    className="text-center text-[11px] font-medium text-orange-700 dark:text-orange-300"
                    role="alert"
                  >
                    {reactionError}
                  </p>
                )}

                {threadMessages.map((message) =>
                  message.isUser ? (
                    <ChatMessageRow
                      key={message.id}
                      message={message}
                      animate={false}
                      attentionChallenge={isAttentionChallengeMessage(message)}
                    />
                  ) : (
                    <ChatMessageRow
                      key={message.id}
                      message={message}
                      animate={false}
                      reactions={getReactionProps(message.id)}
                    />
                  ),
                )}

                {liveTurn && (
                  <AgentTurnRow
                    message={{
                      id: "live-turn",
                      author: liveTurn.author,
                      text: liveTurn.text,
                    }}
                    mode={liveTurn.mode}
                  />
                )}

                <BelieveCopeVote
                  believeCount={localBelieveCount}
                  copeCount={localCopeCount}
                  userVote={localUserVote}
                  onVote={isVotePending ? undefined : handleVote}
                  variant="room"
                />

                <div ref={scrollEndRef} aria-hidden className="h-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreatorBottomPanel ? (
        <RoomComposerShell>
          {attentionRemaining > 0 ? (
            <>
              {challengeProcessingStage ? (
                <ChallengeProcessingStatus stage={challengeProcessingStage} />
              ) : null}
              <BeliefInput
                ref={followUpInputRef}
                value={followUpDraft}
                onChange={(value) => {
                  setFollowUpDraft(value);
                  if (followUpError) setFollowUpError(null);
                }}
                onSubmit={handleFollowUpSubmit}
                disabled={isChallengeSubmitting || isAgentRoundActive}
                isProcessing={isChallengeSubmitting}
                compact
                placeholder="Challenge the debate…"
                submitAriaLabel="Send follow-up"
                processingAriaLabel="Submitting challenge"
                helperText={
                  followUpError ??
                  (challengeProcessingStage ? undefined : "Uses 1 Attention")
                }
              />
            </>
          ) : (
            <RoomConclusionPanel />
          )}
        </RoomComposerShell>
      ) : null}
    </>
  );
}
