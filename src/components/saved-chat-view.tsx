"use client";

import { BelieveCopeVote } from "./believe-cope-vote";
import { BeliefInput } from "./belief-input";
import { MarketLive, MarketUnavailableNote } from "./market-live";
import {
  ChatMessageRow,
  GroupFormationMessage,
  type ChatMessage,
} from "./debate-chat";
import { shouldShowMarketUnavailableNote } from "@/lib/market";
import type { MarketSnapshot } from "@/lib/market";
import type { VoteChoice } from "@/lib/vote";

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
  const userMessage = messages.find((message) => message.isUser);
  const agentMessages = messages.filter((message) => !message.isUser);
  const showVoteResults =
    userVote !== null &&
    believeCount !== undefined &&
    copeCount !== undefined;
  const showMarketUnavailable = shouldShowMarketUnavailableNote({
    market,
    userVote,
    belief,
  });

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full">
      <div className="h-full overflow-y-auto px-4 pb-[160px]">
        <div className="mx-auto w-full max-w-md space-y-4 pt-4">
          {market && <MarketLive market={market} />}
          {showMarketUnavailable && <MarketUnavailableNote />}
          {userMessage && (
            <ChatMessageRow message={userMessage} animate={false} />
          )}
          <GroupFormationMessage animate={false} />
          {agentMessages.map((message) => (
            <ChatMessageRow key={message.id} message={message} animate={false} />
          ))}
          {showVoteResults && (
            <BelieveCopeVote
              believeCount={believeCount}
              copeCount={copeCount}
              userVote={userVote}
            />
          )}
          <div aria-hidden className="h-1" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-background/95 px-4 pt-3 backdrop-blur-md before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-t before:from-background before:to-transparent pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
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
