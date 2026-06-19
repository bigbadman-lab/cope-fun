"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BelieveCopeVote } from "./believe-cope-vote";
import { BeliefInput } from "./belief-input";
import { MarketLive, MarketUnavailableNote } from "./market-live";
import { PinnedBelief } from "./pinned-belief";
import { RoomAttentionDisplay } from "./room-attention-display";
import { RoomConclusionPanel, RoomVisitorPanel } from "./room-bottom-panel";
import {
  AgentTurnRow,
  ChatMessageRow,
  GroupFormationMessage,
  type ChatMessage,
  type MessageReactionProps,
} from "./debate-chat";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { TYPING_FADE_OUT_MS } from "@/lib/debate-timing";
import { shouldShowMarketUnavailableNote } from "@/lib/market";
import { isRoomCreator } from "@/lib/room-creator";
import {
  buildFollowUpResponse,
  createFollowUpAgentMessage,
  createFollowUpUserMessage,
  getAgentTypingDelayMs,
  getGapBetweenAgentsMs,
  pickRespondingAgents,
} from "@/lib/room-follow-up";
import {
  applyVoteChange,
  seedVoteCounts,
  type VoteChoice,
} from "@/lib/vote";
import {
  claimRoomCreatorIfUnassigned,
  updateSavedConversation,
  type SavedConversation,
} from "@/lib/saved-chats";

type SavedChatViewProps = {
  conversation: SavedConversation;
};

type LiveAgentTurn = {
  author: string;
  mode: "typing" | "fading" | "message";
  text: string;
};

export function SavedChatView({ conversation: initialConversation }: SavedChatViewProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [liveTurn, setLiveTurn] = useState<LiveAgentTurn | null>(null);
  const [isAgentRoundActive, setIsAgentRoundActive] = useState(false);
  const roundTimersRef = useRef<number[]>([]);
  const debateBodyRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const belief = conversation.belief;
  const messages = conversation.messages;
  const isCreator = isRoomCreator(conversation.creatorId);
  const attentionRemaining = conversation.attentionRemaining;
  const canSendFollowUp =
    isCreator && attentionRemaining > 0 && !isAgentRoundActive;

  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  useEffect(() => {
    if (initialConversation.creatorId) return;
    const claimed = claimRoomCreatorIfUnassigned(initialConversation.slug);
    if (claimed) setConversation(claimed);
  }, [initialConversation.slug, initialConversation.creatorId]);

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
  const initialBelieveCount =
    conversation.believeCount ?? seededCounts.believeCount;
  const initialCopeCount = conversation.copeCount ?? seededCounts.copeCount;

  const [localBelieveCount, setLocalBelieveCount] = useState(initialBelieveCount);
  const [localCopeCount, setLocalCopeCount] = useState(initialCopeCount);
  const [localUserVote, setLocalUserVote] = useState<VoteChoice | null>(
    conversation.userVote ?? null,
  );

  const handleVote = useCallback(
    (choice: VoteChoice) => {
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
    [localBelieveCount, localCopeCount, localUserVote],
  );

  const beliefMessage = messages.find((message) => message.isUser);
  const threadMessages = messages.filter(
    (message) => !message.isUser || message.id !== beliefMessage?.id,
  );
  const agentMessages = messages.filter((message) => !message.isUser);
  const agentMessageIds = useMemo(
    () => agentMessages.map((message) => message.id),
    [agentMessages],
  );

  const { getCounts, getUserReaction, react, isShaking } = useMessageReactions(
    conversation.slug,
    agentMessageIds,
  );

  const getReactionProps = useCallback(
    (messageId: string): MessageReactionProps => ({
      counts: getCounts(messageId),
      userReaction: getUserReaction(messageId),
      onReact: (reaction) => react(messageId, reaction),
      copeShake: isShaking(messageId),
    }),
    [getCounts, getUserReaction, react, isShaking],
  );

  const hasMarket = conversation.market != null;
  const showMarketUnavailable = shouldShowMarketUnavailableNote({
    market: conversation.market,
    userVote: conversation.userVote,
    belief,
  });

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

  const runAgentRound = useCallback(
    (followUpText: string, baseMessages: ChatMessage[]) => {
      const agents = pickRespondingAgents(followUpText);
      setIsAgentRoundActive(true);
      setLiveTurn(null);

      let elapsed = 320;
      let currentMessages = baseMessages;

      agents.forEach((agent, index) => {
        const typingStart = elapsed;
        const typingDuration = getAgentTypingDelayMs(agent);
        const typingFadeMs = typingStart + typingDuration - TYPING_FADE_OUT_MS;
        const messageAt = typingStart + typingDuration;
        const responseText = buildFollowUpResponse(agent, belief, followUpText);

        scheduleRoundTimer(() => {
          setLiveTurn({ author: agent, mode: "typing", text: "" });
        }, typingStart);

        scheduleRoundTimer(() => {
          setLiveTurn({ author: agent, mode: "fading", text: "" });
        }, typingFadeMs);

        scheduleRoundTimer(() => {
          const agentMessage = createFollowUpAgentMessage(
            agent,
            responseText,
            index,
          );
          currentMessages = [...currentMessages, agentMessage];
          const updated = updateSavedConversation(conversation.slug, {
            messages: currentMessages,
          });
          if (updated) setConversation(updated);
          setLiveTurn(null);

          if (index === agents.length - 1) {
            setIsAgentRoundActive(false);
          }
        }, messageAt);

        elapsed = messageAt + getGapBetweenAgentsMs();
      });
    },
    [belief, conversation.slug, scheduleRoundTimer],
  );

  const handleFollowUpSubmit = useCallback(() => {
    const text = followUpDraft.trim();
    if (!text || !canSendFollowUp) return;

    const userMessage = createFollowUpUserMessage(text, messages.length);
    const nextMessages = [...messages, userMessage];
    const nextAttention = attentionRemaining - 1;

    const updated = updateSavedConversation(conversation.slug, {
      messages: nextMessages,
      attentionRemaining: nextAttention,
    });
    if (!updated) return;

    setConversation(updated);
    setFollowUpDraft("");
    runAgentRound(text, nextMessages);
  }, [
    attentionRemaining,
    canSendFollowUp,
    conversation.slug,
    followUpDraft,
    messages,
    runAgentRound,
  ]);

  const bottomPanelHeight = isCreator
    ? attentionRemaining > 0
      ? "pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))]"
      : "pb-[calc(10rem+env(safe-area-inset-bottom,0px))]"
    : "pb-[calc(11.5rem+env(safe-area-inset-bottom,0px))]";

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="room-pinned-header px-4">
          <div className="mx-auto w-full max-w-md">
            <PinnedBelief text={beliefMessage?.text ?? belief} />
          </div>
        </header>

        <div ref={debateBodyRef} className="room-debate-body">
          <div className={`w-full px-4 pt-4 ${bottomPanelHeight}`}>
            <div className="relative z-0 mx-auto w-full max-w-md space-y-4">
              {isCreator && (
                <RoomAttentionDisplay remaining={attentionRemaining} />
              )}

              {hasMarket && <MarketLive market={conversation.market!} />}
              {!hasMarket && showMarketUnavailable && <MarketUnavailableNote />}

              <GroupFormationMessage animate={false} />

              {threadMessages.map((message) =>
                message.isUser ? (
                  <ChatMessageRow key={message.id} message={message} animate={false} />
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

              {!hasMarket && (
                <BelieveCopeVote
                  believeCount={localBelieveCount}
                  copeCount={localCopeCount}
                  userVote={localUserVote}
                  onVote={handleVote}
                  variant="room"
                />
              )}

              <div ref={scrollEndRef} aria-hidden className="h-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200/80 bg-background px-4 pt-3 pb-safe-4 before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent dark:border-white/5">
        <div className="relative mx-auto w-full max-w-md">
          {isCreator && attentionRemaining > 0 ? (
            <BeliefInput
              value={followUpDraft}
              onChange={setFollowUpDraft}
              onSubmit={handleFollowUpSubmit}
              disabled={isAgentRoundActive}
              compact
              placeholder="Spend Attention to push back…"
              submitAriaLabel="Send follow-up"
            />
          ) : isCreator ? (
            <RoomConclusionPanel />
          ) : (
            <RoomVisitorPanel />
          )}
        </div>
      </div>
    </>
  );
}
