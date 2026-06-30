"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppAuth } from "@/hooks/use-app-auth";
import type {
  PulseEngineRow,
  PulsePositionSide,
  PulseRoundRow,
} from "@/lib/pulse/types";
import {
  ALLOWED_PULSE_ROUND_DURATIONS,
  formatPulseRoundDurationLabel,
  type PulseRoundDurationSeconds,
} from "@/lib/pulse/duration";
import { computePulseRewardPool } from "@/lib/pulse/pool";

import { PULSE_BELIEF_ROOM_ID } from "@/lib/pulse/constants";

type PulseStatusResponse =
  | {
      ok: true;
      engine: PulseEngineRow | null;
      round: PulseRoundRow | null;
      runner?: {
        enabled: boolean;
        started: boolean;
        tickIntervalMs: number;
      };
    }
  | { ok: false; error: string };

type AdvanceResponse =
  | {
      ok: true;
      result: {
        action: "opened_round" | "locked_round" | "finalized_round" | "noop";
        reason: string;
        engine: PulseEngineRow;
        round: PulseRoundRow | null;
        settlement?: {
          winningSide: string;
          creditsPaid: number;
          positionsSettled: number;
        };
      };
    }
  | { ok: false; error: string; message?: string };

type ActionResponse =
  | {
      ok: true;
      engine?: PulseEngineRow;
      round?: PulseRoundRow;
      settledRound?: PulseRoundRow;
      nextRound?: PulseRoundRow;
      settlement?: {
        winningSide: string;
        totalPool: number;
        winningPool: number;
        losingPool: number;
        positionsSettled: number;
        creditsPaid: number;
      };
    }
  | { ok: false; error: string; message?: string };

type StakeResponse =
  | {
      ok: true;
      balanceCredits: number;
      round: {
        believePool: number;
        copePool: number;
      };
    }
  | { ok: false; error: string };

type AdminPulseControlPanelProps = {
  beliefRoomId?: string;
};

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString();
}

function computeSecondsRemaining(closesAt: string | null): number | null {
  if (!closesAt) {
    return null;
  }

  const closesAtMs = Date.parse(closesAt);
  if (!Number.isFinite(closesAtMs)) {
    return null;
  }

  return Math.max(0, Math.floor((closesAtMs - Date.now()) / 1000));
}

function ControlButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-200/80 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-900/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.04]"
    >
      {label}
    </button>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200/60 py-3 last:border-b-0 dark:border-white/[0.06]">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="max-w-[65%] text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

export function AdminPulseControlPanel({
  beliefRoomId = PULSE_BELIEF_ROOM_ID,
}: AdminPulseControlPanelProps) {
  const { ready, authenticated, login, authFetch } = useAppAuth();
  const [engine, setEngine] = useState<PulseEngineRow | null>(null);
  const [round, setRound] = useState<PulseRoundRow | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<{
    enabled: boolean;
    started: boolean;
    tickIntervalMs: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [stakeSide, setStakeSide] = useState<PulsePositionSide>("believe");
  const [stakeAmount, setStakeAmount] = useState("25");
  const [stakePending, setStakePending] = useState(false);
  const [roundDurationSeconds, setRoundDurationSeconds] =
    useState<PulseRoundDurationSeconds>(900);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/pulse/status?beliefRoomId=${encodeURIComponent(beliefRoomId)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as PulseStatusResponse;

      if (!response.ok || !payload.ok) {
        const errorText = payload.ok ? "Could not load Pulse status." : payload.error;
        setMessage({ type: "error", text: errorText });
        return;
      }

      setEngine(payload.engine);
      setRound(payload.round);
      setRunnerStatus(payload.runner ?? null);
    } catch {
      setMessage({ type: "error", text: "Could not load Pulse status." });
    } finally {
      setIsLoading(false);
    }
  }, [beliefRoomId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (
      engine?.roundDurationSeconds &&
      ALLOWED_PULSE_ROUND_DURATIONS.includes(
        engine.roundDurationSeconds as PulseRoundDurationSeconds,
      )
    ) {
      setRoundDurationSeconds(
        engine.roundDurationSeconds as PulseRoundDurationSeconds,
      );
    }
  }, [engine?.roundDurationSeconds]);

  async function runAction(
    actionName: string,
    url: string,
    body: Record<string, string>,
  ) {
    if (pendingAction) {
      return;
    }

    setPendingAction(actionName);
    setMessage(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as ActionResponse;

      if (!response.ok || !payload.ok) {
        const errorText = payload.ok
          ? `Could not ${actionName.toLowerCase()}.`
          : payload.message ?? payload.error;
        setMessage({ type: "error", text: errorText });
        return;
      }

      setMessage({
        type: "success",
        text:
          actionName === "Finalize" && payload.settlement
            ? `Finalize succeeded. ${payload.settlement.winningSide} won. Paid ${payload.settlement.creditsPaid} credits across ${payload.settlement.positionsSettled} position(s).`
            : `${actionName} succeeded.`,
      });
      setLastAction(
        actionName === "Finalize" && payload.settlement
          ? `${actionName}: finalized (${payload.settlement.winningSide})`
          : `${actionName} succeeded`,
      );
      await loadStatus();
    } catch {
      setMessage({ type: "error", text: `Could not ${actionName.toLowerCase()}.` });
    } finally {
      setPendingAction(null);
    }
  }

  async function advanceEngine() {
    if (!engineId || pendingAction) {
      return;
    }

    setPendingAction("Advance");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/pulse/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineId }),
      });
      const payload = (await response.json()) as AdvanceResponse;

      if (!response.ok || !payload.ok) {
        const errorText = payload.ok
          ? "Could not advance engine."
          : payload.message ?? payload.error;
        setMessage({ type: "error", text: errorText });
        return;
      }

      const { action, reason, settlement } = payload.result;
      let text = `Advance: ${action} (${reason}).`;

      if (action === "finalized_round" && settlement) {
        text += ` Paid ${settlement.creditsPaid} credits across ${settlement.positionsSettled} position(s).`;
      }

      setMessage({ type: "success", text });
      setLastAction(text);

      await loadStatus();
    } catch {
      setMessage({ type: "error", text: "Could not advance engine." });
    } finally {
      setPendingAction(null);
    }
  }

  async function updateRoundDuration() {
    if (!engineId || pendingAction) {
      return;
    }

    setPendingAction("Duration");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/pulse/update-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId,
          roundDurationSeconds,
        }),
      });
      const payload = (await response.json()) as ActionResponse;

      if (!response.ok || !payload.ok) {
        const errorText = payload.ok
          ? "Could not update round duration."
          : payload.message ?? payload.error;
        setMessage({ type: "error", text: errorText });
        return;
      }

      setMessage({
        type: "success",
        text: `Round duration set to ${roundDurationSeconds}s for future rounds.`,
      });
      setLastAction(`duration → ${roundDurationSeconds}s`);
      await loadStatus();
    } catch {
      setMessage({ type: "error", text: "Could not update round duration." });
    } finally {
      setPendingAction(null);
    }
  }

  async function placeTestStake() {
    if (!engineId || stakePending || pendingAction) {
      return;
    }

    if (!ready) {
      return;
    }

    if (!authenticated) {
      setMessage({
        type: "error",
        text: "Sign in with Privy (main app) in this browser to place test stakes.",
      });
      return;
    }

    if (round?.status !== "open") {
      setMessage({
        type: "error",
        text: "Round must be open before placing a test stake.",
      });
      return;
    }

    const amount = Number(stakeAmount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
      setMessage({
        type: "error",
        text: "Stake amount must be an integer from 1 to 1000.",
      });
      return;
    }

    setStakePending(true);
    setMessage(null);

    try {
      const response = await authFetch("/api/pulse/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId,
          side: stakeSide,
          stakeAmount: amount,
        }),
      });
      const payload = (await response.json()) as StakeResponse;

      if (!response.ok || !payload.ok) {
        const errorText = payload.ok
          ? "Could not place test stake."
          : payload.error;
        setMessage({ type: "error", text: errorText });
        return;
      }

      setMessage({
        type: "success",
        text: `Test stake placed on ${stakeSide}. Pools: believe ${payload.round.believePool}, cope ${payload.round.copePool}. Balance: ${payload.balanceCredits} credits.`,
      });
      await loadStatus();
    } catch {
      setMessage({ type: "error", text: "Could not place test stake." });
    } finally {
      setStakePending(false);
    }
  }

  const engineId = engine?.id ?? null;
  const hasEngine = Boolean(engineId);
  const isBusy = isLoading || pendingAction !== null || stakePending;
  const canPlaceTestStake =
    hasEngine && round?.status === "open" && !isBusy && ready;

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Temporary internal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Pulse Admin
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Manual control surface for testing the Pulse lifecycle on one known belief
            room. Not public product UI.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-cope-orange hover:underline"
        >
          Back to admin
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-dashed border-cope-orange/30 bg-cope-orange/[0.06] px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300">
        <p>
          Dev-only Pulse controls. Safe to remove once automated engine work replaces
          these manual admin routes.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Runner:{" "}
          {runnerStatus
            ? runnerStatus.enabled
              ? runnerStatus.started
                ? `enabled (tick every ${runnerStatus.tickIntervalMs / 1000}s)`
                : "enabled but not started in this process"
              : "disabled (set PULSE_RUNNER_ENABLED=true and restart)"
            : "—"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <ControlButton
          label={pendingAction === "Bootstrap" ? "Bootstrapping…" : "Bootstrap Engine"}
          onClick={() =>
            void runAction("Bootstrap", "/api/admin/pulse/bootstrap", {
              beliefRoomId,
            })
          }
          disabled={isBusy}
        />
        <ControlButton
          label={pendingAction === "Activate" ? "Activating…" : "Activate Engine"}
          onClick={() =>
            void runAction("Activate", "/api/admin/pulse/activate", {
              engineId: engineId ?? "",
            })
          }
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={pendingAction === "Pause" ? "Pausing…" : "Pause After Current"}
          onClick={() =>
            void runAction("Pause", "/api/admin/pulse/pause", {
              engineId: engineId ?? "",
            })
          }
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={pendingAction === "Resume" ? "Resuming…" : "Resume Engine"}
          onClick={() =>
            void runAction("Resume", "/api/admin/pulse/resume", {
              engineId: engineId ?? "",
            })
          }
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={pendingAction === "Advance" ? "Advancing…" : "Advance Engine"}
          onClick={() => void advanceEngine()}
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={pendingAction === "Open" ? "Opening…" : "Open Round"}
          onClick={() =>
            void runAction("Open", "/api/admin/pulse/open-round", {
              engineId: engineId ?? "",
            })
          }
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={pendingAction === "Lock" ? "Locking…" : "Lock Round"}
          onClick={() =>
            void runAction("Lock", "/api/admin/pulse/lock-round", {
              engineId: engineId ?? "",
            })
          }
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={pendingAction === "Finalize" ? "Finalizing…" : "Finalize Round"}
          onClick={() =>
            void runAction("Finalize", "/api/admin/pulse/finalize-round", {
              engineId: engineId ?? "",
            })
          }
          disabled={isBusy || !hasEngine}
        />
        <ControlButton
          label={isLoading ? "Refreshing…" : "Refresh"}
          onClick={() => void loadStatus()}
          disabled={isBusy}
        />
      </div>

      {message ? (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-200"
              : "border border-rose-500/30 bg-rose-500/[0.08] text-rose-800 dark:text-rose-200"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-surface p-5 dark:border-white/[0.08] dark:bg-surface">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Round duration (dev)
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Duration changes apply to future rounds only.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            Future round length
            <select
              value={roundDurationSeconds}
              onChange={(event) =>
                setRoundDurationSeconds(
                  Number(event.target.value) as PulseRoundDurationSeconds,
                )
              }
              disabled={isBusy || !hasEngine}
              className="min-h-10 rounded-xl border border-zinc-200/80 bg-white px-3 text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {ALLOWED_PULSE_ROUND_DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {formatPulseRoundDurationLabel(duration)}
                </option>
              ))}
            </select>
          </label>
          <ControlButton
            label={pendingAction === "Duration" ? "Saving…" : "Update Duration"}
            onClick={() => void updateRoundDuration()}
            disabled={isBusy || !hasEngine}
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-surface p-5 dark:border-white/[0.08] dark:bg-surface">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Test stake (Privy user)
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Places a stake as the signed-in app user. Admin password alone is not
          enough — use Privy sign-in from the main app in this browser.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            Side
            <select
              value={stakeSide}
              onChange={(event) =>
                setStakeSide(event.target.value as PulsePositionSide)
              }
              disabled={isBusy}
              className="min-h-10 rounded-xl border border-zinc-200/80 bg-white px-3 text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="believe">believe</option>
              <option value="cope">cope</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            Stake amount
            <input
              type="number"
              min={1}
              max={1000}
              step={1}
              value={stakeAmount}
              onChange={(event) => setStakeAmount(event.target.value)}
              disabled={isBusy}
              className="min-h-10 w-28 rounded-xl border border-zinc-200/80 bg-white px-3 text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          {!authenticated ? (
            <ControlButton
              label="Sign in with Privy"
              onClick={() => void login()}
              disabled={!ready || isBusy}
            />
          ) : (
            <ControlButton
              label={stakePending ? "Placing…" : "Place Test Stake"}
              onClick={() => void placeTestStake()}
              disabled={!canPlaceTestStake}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-surface p-5 dark:border-white/[0.08] dark:bg-surface">
        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading Pulse status…</p>
        ) : (
          <dl>
            <StatusRow label="beliefRoomId" value={beliefRoomId} />
            <StatusRow label="engine id" value={formatValue(engine?.id)} />
            <StatusRow label="display pair" value={formatValue(engine?.displayPair)} />
            <StatusRow
              label="lifecycle state"
              value={formatValue(engine?.lifecycleState)}
            />
            <StatusRow label="health" value={formatValue(engine?.health)} />
            <StatusRow
              label="round duration (seconds)"
              value={formatValue(engine?.roundDurationSeconds)}
            />
            <StatusRow
              label="seconds remaining"
              value={formatValue(computeSecondsRemaining(round?.closesAt ?? null))}
            />
            <StatusRow label="latest action" value={formatValue(lastAction)} />
            <StatusRow
              label="active round id"
              value={formatValue(engine?.activeRoundId)}
            />
            <StatusRow
              label="current/latest round number"
              value={formatValue(round?.roundNumber)}
            />
            <StatusRow label="round status" value={formatValue(round?.status)} />
            <StatusRow label="openedAt" value={formatTimestamp(round?.openedAt ?? null)} />
            <StatusRow label="closesAt" value={formatTimestamp(round?.closesAt ?? null)} />
            <StatusRow label="settledAt" value={formatTimestamp(round?.settledAt ?? null)} />
            <StatusRow label="opening price" value={formatValue(round?.openingPrice)} />
            <StatusRow
              label="opening price source"
              value={formatValue(round?.openingPriceSource)}
            />
            <StatusRow label="closing price" value={formatValue(round?.closingPrice)} />
            <StatusRow
              label="closing price source"
              value={formatValue(round?.closingPriceSource)}
            />
            <StatusRow label="winning side" value={formatValue(round?.winningSide)} />
            <StatusRow label="believe pool" value={formatValue(round?.believePool)} />
            <StatusRow label="cope pool" value={formatValue(round?.copePool)} />
            <StatusRow
              label="seed credits"
              value={formatValue(round?.seedCredits)}
            />
            <StatusRow
              label="reward pool"
              value={
                round
                  ? formatValue(
                      computePulseRewardPool({
                        seedCredits: round.seedCredits,
                        believePool: round.believePool,
                        copePool: round.copePool,
                      }),
                    )
                  : "—"
              }
            />
          </dl>
        )}
      </div>
    </div>
  );
}
