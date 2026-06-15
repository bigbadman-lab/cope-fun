"use client";

import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import { InnerPageShell } from "./inner-page-shell";

type ConversationPageLayoutProps = {
  messages: ChatMessage[];
  children?: React.ReactNode;
};

export function ConversationPageLayout({
  messages,
  children,
}: ConversationPageLayoutProps) {
  return (
    <InnerPageShell>
      <div className="inner-page-content space-y-4">
        {messages.map((message) => (
          <ChatMessageRow key={message.id} message={message} animate={false} />
        ))}
        {children}
      </div>
    </InnerPageShell>
  );
}
