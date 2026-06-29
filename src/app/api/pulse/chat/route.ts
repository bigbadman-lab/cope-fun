import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import { isPulseBeliefRoomId } from "@/lib/pulse/constants";
import {
  getPulseRoomChatMessages,
  postPulseRoomChatMessage,
  PulseChatInvalidBodyError,
  PulseChatRoomNotAllowedError,
} from "@/lib/pulse/chat";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

type PulseChatPostRequest = {
  beliefRoomId?: unknown;
  body?: unknown;
};

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function noStoreJson<T>(body: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init?.headers,
    },
  });
}

function parseBeliefRoomId(searchParams: URLSearchParams): string | null {
  const beliefRoomId = searchParams.get("beliefRoomId")?.trim() ?? "";
  if (!beliefRoomId) return null;
  if (!isUuid(beliefRoomId)) return null;
  return beliefRoomId;
}

export async function GET(request: Request) {
  const beliefRoomId = parseBeliefRoomId(new URL(request.url).searchParams);

  if (!beliefRoomId) {
    return noStoreJson(
      { ok: false, error: "beliefRoomId is required." },
      { status: 400 },
    );
  }

  if (!isPulseBeliefRoomId(beliefRoomId)) {
    return noStoreJson(
      { ok: false, error: "Pulse chat is not available for this room." },
      { status: 404 },
    );
  }

  try {
    const messages = await getPulseRoomChatMessages(beliefRoomId);

    return noStoreJson({
      ok: true,
      messages,
    });
  } catch (error) {
    if (error instanceof PulseChatRoomNotAllowedError) {
      return noStoreJson({ ok: false, error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Could not load Pulse chat.";

    console.error("[api/pulse/chat GET]", message);

    return noStoreJson(
      { ok: false, error: "Could not load Pulse chat." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const appUser = await requireAppUser(request);
    const payload = (await request.json()) as PulseChatPostRequest;

    if (typeof payload.beliefRoomId !== "string" || !payload.beliefRoomId.trim()) {
      return noStoreJson(
        { ok: false, error: "beliefRoomId is required." },
        { status: 400 },
      );
    }

    const beliefRoomId = payload.beliefRoomId.trim();
    if (!isUuid(beliefRoomId)) {
      return noStoreJson(
        { ok: false, error: "beliefRoomId must be a valid UUID." },
        { status: 400 },
      );
    }

    if (typeof payload.body !== "string") {
      return noStoreJson(
        { ok: false, error: "body is required." },
        { status: 400 },
      );
    }

    const message = await postPulseRoomChatMessage({
      beliefRoomId,
      body: payload.body,
      user: appUser,
    });

    return noStoreJson({
      ok: true,
      message,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse(error.message);
    }

    if (error instanceof PulseChatRoomNotAllowedError) {
      return noStoreJson({ ok: false, error: error.message }, { status: 404 });
    }

    if (error instanceof PulseChatInvalidBodyError) {
      return noStoreJson({ ok: false, error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Could not post Pulse chat message.";

    console.error("[api/pulse/chat POST]", message);

    return noStoreJson(
      { ok: false, error: "Could not post Pulse chat message." },
      { status: 500 },
    );
  }
}
