import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { getAdvanceablePulseEngines } from "@/lib/db/pulse";
import {
  advancePulseEngine,
  type PulseAdvanceAction,
} from "@/lib/pulse/advance-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CronPulseAdvanceResult = {
  engineId: string;
  action: PulseAdvanceAction | "error";
  reason: string;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

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
  const unauthorized = requireCronAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const engines = await getAdvanceablePulseEngines();
    const results: CronPulseAdvanceResult[] = [];

    for (const engine of engines) {
      try {
        const result = await advancePulseEngine({ engineId: engine.id });

        if (result.action !== "noop") {
          console.info(
            `[cron/pulse/advance] engine=${engine.id} action=${result.action} reason=${result.reason}`,
          );
        }

        results.push({
          engineId: engine.id,
          action: result.action,
          reason: result.reason,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown Pulse advance error.";

        console.error(
          `[cron/pulse/advance] engine=${engine.id} advance failed: ${message}`,
        );

        results.push({
          engineId: engine.id,
          action: "error",
          reason: message,
        });
      }
    }

    return noStoreJson({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not advance Pulse engines.";

    console.error("[cron/pulse/advance]", message);

    return noStoreJson(
      { ok: false, error: "Could not advance Pulse engines." },
      { status: 500 },
    );
  }
}
