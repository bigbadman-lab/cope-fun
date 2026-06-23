import {
  generateFollowUpReplies,
  type FollowUpGenerationResult,
} from "@/lib/cope-engine";
import type { ChatMessage } from "@/components/debate-chat";

type GenerateFollowUpRequest = {
  belief?: unknown;
  followUp?: unknown;
  messages?: unknown;
  attentionRemaining?: unknown;
};

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "author" in value &&
    "text" in value
  );
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isChatMessage);
}

export async function POST(request: Request) {
  let belief = "";
  let followUp = "";

  try {
    const body = (await request.json()) as GenerateFollowUpRequest;
    belief = typeof body.belief === "string" ? body.belief : "";
    followUp = typeof body.followUp === "string" ? body.followUp : "";

    const result = await generateFollowUpReplies({
      belief,
      followUp,
      messages: normalizeMessages(body.messages),
      attentionRemaining:
        typeof body.attentionRemaining === "number" ? body.attentionRemaining : 0,
    });

    return Response.json(result);
  } catch {
    const result: FollowUpGenerationResult = {
      ok: false,
      belief: belief.trim(),
      followUp: followUp.trim(),
      messages: [],
      agents: [],
      error: "Could not generate follow-up.",
    };

    return Response.json(result);
  }
}
