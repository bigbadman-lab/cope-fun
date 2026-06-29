import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { bootstrapPulseForBeliefRoom } from "@/lib/pulse/bootstrap";

type BootstrapPulseRequest = {
  beliefRoomId?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as BootstrapPulseRequest;

    if (typeof body.beliefRoomId !== "string" || !body.beliefRoomId.trim()) {
      return NextResponse.json(
        { ok: false, error: "beliefRoomId is required." },
        { status: 400 },
      );
    }

    const beliefRoomId = body.beliefRoomId.trim();
    if (!isUuid(beliefRoomId)) {
      return NextResponse.json(
        { ok: false, error: "beliefRoomId must be a valid UUID." },
        { status: 400 },
      );
    }

    const result = await bootstrapPulseForBeliefRoom({ beliefRoomId });

    return NextResponse.json({
      ok: true,
      engine: result.engine,
      round: result.round,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not bootstrap Pulse.";

    if (message === "Belief room not found.") {
      return NextResponse.json(
        { ok: false, error: message },
        { status: 404 },
      );
    }

    if (message === "Belief room id is required.") {
      return NextResponse.json(
        { ok: false, error: "beliefRoomId is required." },
        { status: 400 },
      );
    }

    console.error("[admin/pulse/bootstrap]", message);

    return NextResponse.json(
      { ok: false, error: "Could not bootstrap Pulse." },
      { status: 500 },
    );
  }
}
