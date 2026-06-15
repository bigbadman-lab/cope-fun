import Link from "next/link";
import { ParticipantAvatarStack } from "./avatar-placeholder";
import {
  formatConversationTime,
  getLastMessagePreview,
  type SavedConversation,
} from "@/lib/saved-chats";

type ConversationListRowProps = {
  conversation: SavedConversation;
};

export function ConversationListRow({ conversation }: ConversationListRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-3.5 transition-colors hover:bg-white/[0.02]">
      <ParticipantAvatarStack participants={conversation.participants} />
      <Link
        href={`/room/${conversation.slug}`}
        className="min-w-0 flex-1 active:opacity-80"
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] font-medium text-zinc-100">
            {conversation.belief}
          </p>
          <span className="shrink-0 text-[11px] text-zinc-500">
            {formatConversationTime(conversation.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500">
          {getLastMessagePreview(conversation)}
        </p>
      </Link>
    </div>
  );
}
