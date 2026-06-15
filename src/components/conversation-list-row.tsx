import Link from "next/link";
import { BeliefListBadges } from "./belief-list-badges";
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
    <div className="flex w-full items-start gap-3 border-b border-zinc-200/80 py-4 transition-colors active:bg-zinc-950/[0.03] dark:border-white/5 dark:active:bg-white/[0.02] sm:items-center sm:py-3.5 sm:hover:bg-zinc-950/[0.03] dark:sm:hover:bg-white/[0.02]">
      <ParticipantAvatarStack participants={conversation.participants} />
      <Link
        href={`/room/${conversation.slug}`}
        className="min-w-0 flex-1"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
            {conversation.belief}
          </p>
          <span className="shrink-0 text-xs text-zinc-500">
            {formatConversationTime(conversation.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-zinc-500">
          {getLastMessagePreview(conversation)}
        </p>
        <BeliefListBadges conversation={conversation} />
      </Link>
    </div>
  );
}
