import { NextResponse } from "next/server";
import { getPulsePublicStatus } from "@/lib/pulse/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const beliefRoomId = searchParams.get("beliefRoomId")?.trim() ?? "";

  if (!beliefRoomId) {
    return noStoreJson(
      { ok: false, error: "beliefRoomId is required." },
      { status: 400 },
    );
  }

  if (!isUuid(beliefRoomId)) {
    return noStoreJson(
      { ok: false, error: "beliefRoomId must be a valid UUID." },
      { status: 400 },
    );
  }

  try {
    const status = await getPulsePublicStatus(beliefRoomId);

    if (!status) {
      return noStoreJson(
        { ok: false, error: "pulse_not_found" },
        { status: 404 },
      );
    }

    return noStoreJson({
      ok: true,
      engine: status.engine,
      round: status.round,
      livePrice: status.livePrice,
      derived: status.derived,
      automation: status.automation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load Pulse status.";

    console.error("[api/pulse/status]", message);

    return noStoreJson(
      { ok: false, error: "Could not load Pulse status." },
      { status: 500 },
    );
  }
}
