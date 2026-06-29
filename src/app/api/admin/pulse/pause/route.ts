import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import {
  pausePulseEngine,
  PulsePauseNotAllowedError,
} from "@/lib/pulse/admin-controls";
import { PulseEngineNotFoundError } from "@/lib/pulse/open-round";

type PausePulseEngineRequest = {
  engineId?: unknown;
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
    const body = (await request.json()) as PausePulseEngineRequest;

    if (typeof body.engineId !== "string" || !body.engineId.trim()) {
      return NextResponse.json(
        { ok: false, error: "engineId is required." },
        { status: 400 },
      );
    }

    const engineId = body.engineId.trim();
    if (!isUuid(engineId)) {
      return NextResponse.json(
        { ok: false, error: "engineId must be a valid UUID." },
        { status: 400 },
      );
    }

    const result = await pausePulseEngine({ engineId });

    return NextResponse.json({
      ok: true,
      engine: result.engine,
      round: result.round,
    });
  } catch (error) {
    if (error instanceof PulseEngineNotFoundError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 404 },
      );
    }

    if (error instanceof PulsePauseNotAllowedError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Could not pause Pulse engine.";

    console.error("[admin/pulse/pause]", message);

    return NextResponse.json(
      { ok: false, error: "Could not pause Pulse engine." },
      { status: 500 },
    );
  }
}
