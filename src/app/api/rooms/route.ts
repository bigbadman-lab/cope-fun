import { createBeliefRoom } from "@/lib/db/rooms";
import type { ChatMessage } from "@/components/debate-chat";

const USER_DISPLAY_NAME = "You";
const ENGINE_AUTHOR = "Cope Engine";
const ALLOWED_AGENT_AUTHORS = new Set(["Mason", "Victor", "Logan", "Theo"]);
const MAX_BELIEF_LENGTH = 500;
const MAX_MESSAGE_COUNT = 20;
const MAX_MESSAGE_LENGTH = 1200;

type CreateRoomRequest = {
  anonymousToken?: unknown;
  belief?: unknown;
  messages?: unknown;
  attentionRemaining?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeMessage(value: unknown): ChatMessage | null {
  if (!isPlainObject(value)) return null;

  const id = typeof value.id === "string" ? value.id.trim() : "";
  const author = typeof value.author === "string" ? value.author.trim() : "";
  const text = typeof value.text === "string" ? value.text.trim() : "";
  const isUser = value.isUser === true;
  const isAttentionChallenge = value.isAttentionChallenge === true;

  if (!id || !author || !text || text.length > MAX_MESSAGE_LENGTH) return null;

  if (isUser) {
    if (author !== USER_DISPLAY_NAME) return null;
  } else if (author !== ENGINE_AUTHOR && !ALLOWED_AGENT_AUTHORS.has(author)) {
    return null;
  }

  return {
    id,
    author,
    text,
    isUser: isUser || undefined,
    isAttentionChallenge: isAttentionChallenge || undefined,
  };
}

function normalizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGE_COUNT) {
    return null;
  }

  const messages = value.map(normalizeMessage);
  if (messages.some((message) => message == null)) return null;

  return messages as ChatMessage[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRoomRequest;
    const anonymousToken =
      typeof body.anonymousToken === "string" ? body.anonymousToken.trim() : "";
    const belief = typeof body.belief === "string" ? body.belief.trim() : "";
    const messages = normalizeMessages(body.messages);

    if (!anonymousToken) {
      return Response.json(
        { ok: false, error: "Anonymous session token is required." },
        { status: 400 },
      );
    }

    if (!belief || belief.length > MAX_BELIEF_LENGTH) {
      return Response.json(
        { ok: false, error: "Belief is invalid." },
        { status: 400 },
      );
    }

    if (!messages) {
      return Response.json(
        { ok: false, error: "Room messages are invalid." },
        { status: 400 },
      );
    }

    const result = await createBeliefRoom({
      anonymousToken,
      belief,
      messages,
      attentionRemaining:
        typeof body.attentionRemaining === "number"
          ? body.attentionRemaining
          : undefined,
    });

    return Response.json({ ok: true, slug: result.slug, room: result.room });
  } catch {
    return Response.json(
      { ok: false, error: "Could not create room." },
      { status: 500 },
    );
  }
}
