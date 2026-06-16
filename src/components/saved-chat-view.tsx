"use client";

import { useCallback, useMemo, useState } from "react";
import { BelieveCopeVote } from "./believe-cope-vote";
import { BeliefInput } from "./belief-input";
import { MarketLive, MarketUnavailableNote } from "./market-live";
import {
  ChatMessageRow,
  GroupFormationMessage,
  type ChatMessage,
  type MessageReactionProps,
} from "./debate-chat";
import { useMessageReactions } from "@/hooks/use-message-reactions";
import { shouldShowMarketUnavailableNote } from "@/lib/market";
import type { MarketSnapshot } from "@/lib/market";
import {
  applyVoteChange,
  seedVoteCounts,
  type VoteChoice,
} from "@/lib/vote";

type SavedChatViewProps = {
  messages: ChatMessage[];
  belief: string;
  userVote?: VoteChoice | null;
  believeCount?: number;
  copeCount?: number;
  market?: MarketSnapshot;
};

export function SavedChatView({
  messages,
  belief,
  userVote = null,
  believeCount,
  copeCount,
  market,
}: SavedChatViewProps) {
  const seededCounts = useMemo(() => seedVoteCounts(belief), [belief]);
  const initialBelieveCount = believeCount ?? seededCounts.believeCount;
  const initialCopeCount = copeCount ?? seededCounts.copeCount;

  const [localBelieveCount, setLocalBelieveCount] = useState(initialBelieveCount);
  const [localCopeCount, setLocalCopeCount] = useState(initialCopeCount);
  const [localUserVote, setLocalUserVote] = useState<VoteChoice | null>(userVote);

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

  const userMessage = messages.find((message) => message.isUser);
  const agentMessages = messages.filter((message) => !message.isUser);
  const agentMessageIds = useMemo(
    () => agentMessages.map((message) => message.id),
    [agentMessages],
  );
  const { getCounts, getUserReaction, react, isShaking } = useMessageReactions(
    belief,
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

  const hasMarket = market != null;
  const showMarketUnavailable = shouldShowMarketUnavailableNote({
    market,
    userVote,
    belief,
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden w-full">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[calc(9rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto w-full max-w-md space-y-4 pt-4">
          {hasMarket && <MarketLive market={market} />}
          {!hasMarket && showMarketUnavailable && <MarketUnavailableNote />}
          {userMessage && (
            <ChatMessageRow message={userMessage} animate={false} />
          )}
          <GroupFormationMessage animate={false} />
          {agentMessages.map((message) => (
            <ChatMessageRow
              key={message.id}
              message={message}
              animate={false}
              reactions={getReactionProps(message.id)}
            />
          ))}
          {!hasMarket && (
            <BelieveCopeVote
              believeCount={localBelieveCount}
              copeCount={localCopeCount}
              userVote={localUserVote}
              onVote={handleVote}
              variant="room"
            />
          )}
          <div aria-hidden className="h-1" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200/80 bg-background px-4 pt-3 pb-safe-4 before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent dark:border-white/5">
        <div className="relative mx-auto w-full max-w-md">
          <BeliefInput
            value={belief}
            onChange={() => {}}
            onSubmit={() => {}}
            disabled
            compact
          />
        </div>
      </div>
    </div>
  );
}
