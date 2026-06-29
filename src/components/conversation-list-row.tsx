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
  variant?: "default" | "homepage";
};

const baseRowLinkClass = [
  "group -mx-2 flex w-auto items-start gap-3 rounded-xl px-2 py-3.5",
  "transition-[background-color,transform] duration-300 ease-out",
  "active:scale-[0.998]",
  "sm:items-center sm:py-4",
].join(" ");

export function ConversationListRow({
  conversation,
  variant = "default",
}: ConversationListRowProps) {
  const isHomepage = variant === "homepage";
  const rowLinkClass = `${baseRowLinkClass} ${
    isHomepage
      ? "hover:bg-white/[0.06] active:bg-white/[0.08]"
      : "hover:bg-zinc-900/[0.04] active:bg-zinc-900/[0.06] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06]"
  }`;

  return (
    <div
      className={`border-b last:border-b-0 ${
        isHomepage
          ? "border-white/10"
          : "border-zinc-200/60 dark:border-white/[0.06]"
      }`}
    >
      <Link href={`/room/${conversation.slug}`} className={rowLinkClass}>
        <div className="shrink-0 pt-0.5 transition-transform duration-300 ease-out group-hover:scale-[1.04] sm:pt-0">
          <ParticipantAvatarStack
            participants={conversation.participants}
            linkable={false}
            variant={isHomepage ? "homepage" : "default"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p
              className={`min-w-0 flex-1 text-base font-medium leading-snug transition-colors duration-300 ease-out ${
                isHomepage
                  ? "text-white group-hover:text-white"
                  : "text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white"
              }`}
            >
              {conversation.belief}
            </p>
            <span
              className={`shrink-0 text-xs transition-colors duration-300 ease-out ${
                isHomepage
                  ? "text-white/60 group-hover:text-white/75"
                  : "text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
              }`}
            >
              {formatConversationTime(conversation.createdAt)}
            </span>
          </div>
          <p
            className={`mt-0.5 line-clamp-2 text-sm leading-relaxed transition-colors duration-300 ease-out ${
              isHomepage
                ? "text-white/65 group-hover:text-white/80"
                : "text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
            }`}
          >
            {getLastMessagePreview(conversation)}
          </p>
          <BeliefListBadges conversation={conversation} />
        </div>
      </Link>
    </div>
  );
}
