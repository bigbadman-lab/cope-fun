import { USER_DISPLAY_NAME } from "@/components/avatar-placeholder";
import type { SavedConversation } from "@/lib/saved-chats";
import type { VoteChoice } from "@/lib/vote";

export type SearchResult = {
  id: string;
  slug: string;
  belief: string;
  createdAt: string;
  preview: string;
  hasMarket: boolean;
  userVote: VoteChoice | null;
  normalizedText: string;
};

const RESULT_LIMIT = 10;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLastMessagePreview(conversation: SavedConversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return "";
  const author = last.isUser ? USER_DISPLAY_NAME : last.author;
  return `${author}: ${last.text}`;
}

export function buildSearchIndex(
  conversations: SavedConversation[],
): SearchResult[] {
  return conversations.map((conversation) => {
    const hasMarket = false;
    const voteTokens =
      conversation.userVote === "believe"
        ? "voted believe"
        : conversation.userVote === "cope"
          ? "voted cope"
          : "";

    const messageText = conversation.messages
      .map((message) => `${message.author} ${message.text}`)
      .join(" ");

    const normalizedText = normalizeText(
      [
        conversation.belief,
        conversation.slug,
        voteTokens,
        messageText,
      ].join(" "),
    );

    return {
      id: conversation.id,
      slug: conversation.slug,
      belief: conversation.belief,
      createdAt: conversation.createdAt,
      preview: getLastMessagePreview(conversation),
      hasMarket,
      userVote: conversation.userVote ?? null,
      normalizedText,
    };
  });
}

export function searchConversations(
  index: SearchResult[],
  rawQuery: string,
  limit = RESULT_LIMIT,
): SearchResult[] {
  const query = normalizeText(rawQuery);

  if (!query) {
    return index.slice(0, limit);
  }

  const tokens = query.split(" ").filter(Boolean);

  return index
    .filter((item) => tokens.every((token) => item.normalizedText.includes(token)))
    .slice(0, limit);
}

export { RESULT_LIMIT };
