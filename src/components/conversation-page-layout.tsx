"use client";

import { ChatMessageRow, type ChatMessage } from "./debate-chat";
import { TopNav } from "./top-nav";

type ConversationPageLayoutProps = {
  messages: ChatMessage[];
  children?: React.ReactNode;
};

export function ConversationPageLayout({
  messages,
  children,
}: ConversationPageLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto pt-14">
        <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
          {messages.map((message) => (
            <ChatMessageRow
              key={message.id}
              message={message}
              animate={false}
            />
          ))}
          {children}
        </div>
      </main>
    </div>
  );
}
