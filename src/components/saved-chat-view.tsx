"use client";

import { BeliefInput } from "./belief-input";
import {
  ChatMessageRow,
  GroupFormationMessage,
  type ChatMessage,
} from "./debate-chat";

const INPUT_BOTTOM_PADDING_PX = 16;

type SavedChatViewProps = {
  messages: ChatMessage[];
  belief: string;
};

export function SavedChatView({ messages, belief }: SavedChatViewProps) {
  const userMessage = messages.find((message) => message.isUser);
  const agentMessages = messages.filter((message) => !message.isUser);

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full">
      <div className="absolute inset-0 overflow-y-auto px-4 pb-40">
        <div className="mx-auto w-full max-w-md space-y-4 pt-4">
          {userMessage && (
            <ChatMessageRow message={userMessage} animate={false} />
          )}
          <GroupFormationMessage animate={false} />
          {agentMessages.map((message) => (
            <ChatMessageRow key={message.id} message={message} animate={false} />
          ))}
          <div aria-hidden className="h-1" />
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 px-4"
        style={{ paddingBottom: INPUT_BOTTOM_PADDING_PX }}
      >
        <div className="mx-auto w-full max-w-md">
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
