import "server-only";

import { getAdvanceablePulseEngines } from "@/lib/db/pulse";
import { advancePulseEngine } from "@/lib/pulse/advance-engine";

/**
 * In-process MVP Pulse runner.
 *
 * Ticks every few seconds and calls advancePulseEngine() for eligible engines.
 * Production can later move this to Vercel Cron, a Supabase Edge Function, or a
 * dedicated worker without changing the advance orchestration logic.
 */
const GLOBAL_RUNNER_KEY = Symbol.for("cope.pulseRunner");

const PULSE_RUNNER_TICK_MS = 5_000;

type PulseRunnerState = {
  started: boolean;
  tickInProgress: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
};

function getRunnerState(): PulseRunnerState {
  const globalState = globalThis as typeof globalThis & {
    [GLOBAL_RUNNER_KEY]?: PulseRunnerState;
  };

  if (!globalState[GLOBAL_RUNNER_KEY]) {
    globalState[GLOBAL_RUNNER_KEY] = {
      started: false,
      tickInProgress: false,
      intervalId: null,
    };
  }

  return globalState[GLOBAL_RUNNER_KEY];
}

export function isPulseRunnerEnabled(): boolean {
  return process.env.PULSE_RUNNER_ENABLED === "true";
}

function isPulseRunnerDebugEnabled(): boolean {
  return process.env.PULSE_RUNNER_DEBUG === "true";
}

export type PulseRunnerStatus = {
  enabled: boolean;
  started: boolean;
  tickIntervalMs: number;
};

export function getPulseRunnerStatus(): PulseRunnerStatus {
  const state = getRunnerState();

  return {
    enabled: isPulseRunnerEnabled(),
    started: state.started,
    tickIntervalMs: PULSE_RUNNER_TICK_MS,
  };
}

async function runPulseRunnerTick(): Promise<void> {
  const state = getRunnerState();

  if (state.tickInProgress) {
    return;
  }

  state.tickInProgress = true;

  try {
    const engines = await getAdvanceablePulseEngines();

    for (const engine of engines) {
      try {
        const result = await advancePulseEngine({ engineId: engine.id });

        if (result.action !== "noop") {
          console.info(
            `[pulse-runner] engine=${engine.id} action=${result.action} reason=${result.reason}`,
          );
          continue;
        }

        if (isPulseRunnerDebugEnabled()) {
          console.info(
            `[pulse-runner] engine=${engine.id} noop reason=${result.reason}`,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown Pulse runner error.";

        console.error(
          `[pulse-runner] engine=${engine.id} advance failed: ${message}`,
        );
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Pulse runner tick error.";

    console.error(`[pulse-runner] tick failed: ${message}`);
  } finally {
    state.tickInProgress = false;
  }
}

/** Booted once from instrumentation.ts when PULSE_RUNNER_ENABLED=true. */
export function startPulseRunner(): void {
  if (!isPulseRunnerEnabled()) {
    return;
  }

  const state = getRunnerState();
  if (state.started) {
    return;
  }

  state.started = true;

  state.intervalId = setInterval(() => {
    void runPulseRunnerTick();
  }, PULSE_RUNNER_TICK_MS);

  void runPulseRunnerTick();
}
