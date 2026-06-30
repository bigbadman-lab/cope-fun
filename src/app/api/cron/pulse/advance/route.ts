import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { getAdvanceablePulseEngines } from "@/lib/db/pulse";
import {
  advancePulseEngineChained,
  type PulseAdvanceAction,
} from "@/lib/pulse/advance-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CronPulseAdvanceStep = {
  action: PulseAdvanceAction | "error";
  reason: string;
};

type CronPulseAdvanceResult = {
  engineId: string;
  steps: CronPulseAdvanceStep[];
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
        const chained = await advancePulseEngineChained({ engineId: engine.id });
        const steps: CronPulseAdvanceStep[] = chained.steps.map((step) => ({
          action: step.action,
          reason: step.reason,
        }));

        for (const step of steps) {
          if (step.action !== "noop") {
            console.info(
              `[cron/pulse/advance] engine=${engine.id} action=${step.action} reason=${step.reason}`,
            );
          }
        }

        const lastStep = steps.at(-1) ?? {
          action: "noop" as const,
          reason: "no_steps",
        };

        results.push({
          engineId: engine.id,
          steps,
          action: lastStep.action,
          reason: lastStep.reason,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown Pulse advance error.";

        console.error(
          `[cron/pulse/advance] engine=${engine.id} advance failed: ${message}`,
        );

        results.push({
          engineId: engine.id,
          steps: [],
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
