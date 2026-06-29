import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { getPulseRunnerStatus } from "@/lib/pulse/runner";
import { getPulseAdminStatus } from "@/lib/pulse/status";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const beliefRoomId = searchParams.get("beliefRoomId")?.trim() ?? "";

  if (!beliefRoomId) {
    return NextResponse.json(
      { ok: false, error: "beliefRoomId is required." },
      { status: 400 },
    );
  }

  if (!isUuid(beliefRoomId)) {
    return NextResponse.json(
      { ok: false, error: "beliefRoomId must be a valid UUID." },
      { status: 400 },
    );
  }

  try {
    const status = await getPulseAdminStatus(beliefRoomId);

    return NextResponse.json({
      ok: true,
      engine: status.engine,
      round: status.round,
      runner: getPulseRunnerStatus(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load Pulse status.";

    console.error("[admin/pulse/status]", message);

    return NextResponse.json(
      { ok: false, error: "Could not load Pulse status." },
      { status: 500 },
    );
  }
}
