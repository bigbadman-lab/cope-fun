"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isExpiredOpenMarket } from "@/lib/markets/display-status";
import { formatWholeAmount } from "@/lib/markets/format-amount";
import {
  canEditMarketContent,
  getPublishReadinessWarnings,
  isTerminalMarketStatus,
} from "@/lib/markets/admin-publish-guardrails";
import { MarketStatusBadge } from "./market-status-badge";
import type {
  AdminMarketCandidate,
  AdminMarketRow,
  AdminMarketsData,
  MarketSide,
} from "@/lib/markets/types";
import type { SeasonLaunchReport } from "@/lib/markets/season-curation";

type AdminMarketsSectionProps = {
  data: AdminMarketsData;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function SeasonLaunchChecklist({ report }: { report: SeasonLaunchReport }) {
  const target = report.launchMarketTarget;

  return (
    <section className="rounded-2xl border border-cope-orange/25 bg-cope-orange/[0.05] dark:border-cope-orange/20 dark:bg-cope-orange/[0.07]">
      <div className="border-b border-cope-orange/15 px-5 py-4 dark:border-cope-orange/15">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {report.seasonName} launch checklist
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Read-only readiness report. Markets are not seeded automatically.
        </p>
      </div>
      <ul className="space-y-2 px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300">
        <li>
          {report.seasonName} launch markets:{" "}
          <span className="font-medium tabular-nums">
            {report.publicLaunchMarkets} / {target}
          </span>
        </li>
        <li>
          Ordered markets:{" "}
          <span className="font-medium tabular-nums">
            {report.orderedMarkets} / {target}
          </span>
        </li>
        <li>
          Treasury Conviction set:{" "}
          <span className="font-medium tabular-nums">
            {report.treasuryConvictionSet} / {target}
          </span>
        </li>
        <li>
          Resolution criteria set:{" "}
          <span className="font-medium tabular-nums">
            {report.resolutionCriteriaSet} / {target}
          </span>
        </li>
        <li>
          Future close time set:{" "}
          <span className="font-medium tabular-nums">
            {report.futureCloseTimeSet} / {target}
          </span>
        </li>
        <li>
          Published / open markets:{" "}
          <span className="font-medium tabular-nums">
            {report.publishedOpenMarkets} / {target}
          </span>
        </li>
        <li>
          Draft markets:{" "}
          <span className="font-medium tabular-nums">{report.draftMarkets}</span>
        </li>
      </ul>
      {report.duplicateDisplayOrders.length > 0 ? (
        <p className="border-t border-cope-orange/15 px-5 py-3 text-xs text-rose-600 dark:text-rose-400">
          Duplicate display orders:{" "}
          {report.duplicateDisplayOrders.join(", ")}
        </p>
      ) : null}
      {report.missingDisplayOrders.length > 0 &&
      report.missingDisplayOrders.length <= 10 ? (
        <p className="border-t border-cope-orange/15 px-5 py-3 text-xs text-zinc-500">
          Missing display orders (1–{target}):{" "}
          {report.missingDisplayOrders.join(", ")}
        </p>
      ) : report.missingDisplayOrders.length > 10 ? (
        <p className="border-t border-cope-orange/15 px-5 py-3 text-xs text-zinc-500">
          Missing {report.missingDisplayOrders.length} display order slots in 1–
          {target}.
        </p>
      ) : null}
    </section>
  );
}

function CurationMeta({ market }: { market: AdminMarketRow }) {
  return (
    <p className="mt-1 text-xs text-zinc-500">
      Season {market.seasonId}
      {market.displayOrder !== null ? ` · Order #${market.displayOrder}` : " · Unordered"}
      {market.isFeatured ? " · Featured" : ""}
    </p>
  );
}

function MarketEditForm({ market }: { market: AdminMarketRow }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const contentEditable = canEditMarketContent(market.status);
  const terminal = isTerminalMarketStatus(market.status);

  const [title, setTitle] = useState(market.title);
  const [resolutionCriteria, setResolutionCriteria] = useState(
    market.resolutionCriteria,
  );
  const [resolutionSource, setResolutionSource] = useState(
    market.resolutionSource ?? "",
  );
  const [closesAt, setClosesAt] = useState(formatDateTimeLocal(market.closesAt));
  const [resolvesAt, setResolvesAt] = useState(
    formatDateTimeLocal(market.resolvesAt),
  );
  const [treasuryConvictionCope, setTreasuryConvictionCope] = useState(
    market.treasuryConvictionCope > 0
      ? String(market.treasuryConvictionCope)
      : "",
  );
  const [seasonId, setSeasonId] = useState(market.seasonId);
  const [displayOrder, setDisplayOrder] = useState(
    market.displayOrder?.toString() ?? "",
  );
  const [isFeatured, setIsFeatured] = useState(market.isFeatured);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const body: Record<string, unknown> = {
        seasonId,
        displayOrder: displayOrder.trim() ? Number(displayOrder.trim()) : null,
        isFeatured,
      };

      if (contentEditable) {
        body.title = title;
        body.resolutionCriteria = resolutionCriteria;
        body.resolutionSource = resolutionSource.trim() || null;
        body.closesAt = new Date(closesAt).toISOString();
        body.resolvesAt = resolvesAt
          ? new Date(resolvesAt).toISOString()
          : null;
        body.treasuryConvictionCope = treasuryConvictionCope.trim()
          ? Number(treasuryConvictionCope.trim())
          : 0;
      }

      const response = await fetch(
        `/api/admin/markets/${encodeURIComponent(market.id)}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not update market.");
        return;
      }

      setSuccess("Saved.");
      setIsOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(null);
        }}
        className="mt-2 inline-flex min-h-7 items-center rounded-lg border border-zinc-200/80 px-2.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-900/[0.04] dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
      >
        Edit market
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-3 space-y-2 rounded-xl border border-zinc-200/80 bg-surface/50 p-3 dark:border-white/[0.08] dark:bg-surface/40"
    >
      {terminal ? (
        <p className="text-[11px] text-zinc-500">
          Resolved or voided — only season, display order, and featured can be
          edited.
        </p>
      ) : null}

      {contentEditable ? (
        <>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Market title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
            />
            <p className="mt-1 text-[10px] text-zinc-500">
              Room belief: {market.roomBelief}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Resolution criteria
            </label>
            <textarea
              value={resolutionCriteria}
              onChange={(event) => setResolutionCriteria(event.target.value)}
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Resolution source (optional)
            </label>
            <input
              value={resolutionSource}
              onChange={(event) => setResolutionSource(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                Closes at
              </label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(event) => setClosesAt(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                Resolves at (optional)
              </label>
              <input
                type="datetime-local"
                value={resolvesAt}
                onChange={(event) => setResolvesAt(event.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              Treasury Conviction ($COPE)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={treasuryConvictionCope}
              onChange={(event) => setTreasuryConvictionCope(event.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
            />
          </div>
        </>
      ) : null}

      <div>
        <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Season ID
        </label>
        <input
          value={seasonId}
          onChange={(event) => setSeasonId(event.target.value)}
          required
          placeholder="season-1"
          className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Display order (optional)
        </label>
        <input
          type="number"
          min={1}
          step={1}
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
          placeholder="1–10"
          className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-2.5 py-1.5 text-xs dark:border-white/10"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(event) => setIsFeatured(event.target.checked)}
          className="size-3.5 rounded border-zinc-300"
        />
        Featured market
      </label>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-600">{success}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-7 items-center rounded-lg bg-cope-orange px-2.5 text-[11px] font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="inline-flex min-h-7 items-center rounded-lg border border-zinc-200/80 px-2.5 text-[11px] font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MarketPools({ market }: { market: AdminMarketRow }) {
  return (
    <p className="mt-1 text-xs text-zinc-500">
      Believe {market.believePool.toLocaleString()} · Cope{" "}
      {market.copePool.toLocaleString()} · {market.participantCount}{" "}
      {market.participantCount === 1 ? "participant" : "participants"}
      {market.treasuryConvictionCope > 0
        ? ` · Treasury ${formatWholeAmount(market.treasuryConvictionCope)} $COPE`
        : ""}
    </p>
  );
}

function CreateMarketForm({
  candidate,
  onCreated,
}: {
  candidate: AdminMarketCandidate;
  onCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(candidate.belief.slice(0, 120));
  const [resolutionCriteria, setResolutionCriteria] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [resolvesAt, setResolvesAt] = useState("");
  const [treasuryConvictionCope, setTreasuryConvictionCope] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/markets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: candidate.roomId,
          title,
          resolutionCriteria,
          resolutionSource: resolutionSource || null,
          closesAt: new Date(closesAt).toISOString(),
          resolvesAt: resolvesAt ? new Date(resolvesAt).toISOString() : null,
          treasuryConvictionCope: treasuryConvictionCope.trim()
            ? Number(treasuryConvictionCope.trim())
            : 0,
        }),
      });

      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not create market.");
        return;
      }

      setIsOpen(false);
      onCreated();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-8 items-center rounded-lg border border-cope-orange/30 bg-cope-orange/10 px-2.5 text-[11px] font-medium text-cope-orange transition-colors hover:bg-cope-orange/15"
      >
        Create market
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-3 space-y-3 rounded-xl border border-zinc-200/80 bg-surface/50 p-4 dark:border-white/[0.08] dark:bg-surface/40"
    >
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Title
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-sm dark:border-white/10"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Resolution criteria
        </label>
        <textarea
          value={resolutionCriteria}
          onChange={(event) => setResolutionCriteria(event.target.value)}
          required
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-sm dark:border-white/10"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Resolution source (optional)
        </label>
        <input
          value={resolutionSource}
          onChange={(event) => setResolutionSource(event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-sm dark:border-white/10"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
            Closes at
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(event) => setClosesAt(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-sm dark:border-white/10"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
            Resolves at (optional)
          </label>
          <input
            type="datetime-local"
            value={resolvesAt}
            onChange={(event) => setResolvesAt(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-sm dark:border-white/10"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
          Treasury Conviction ($COPE)
        </label>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={treasuryConvictionCope}
          onChange={(event) => setTreasuryConvictionCope(event.target.value)}
          placeholder="0"
          className="mt-1 w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-sm dark:border-white/10"
        />
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Display-only MVP field. Does not affect COPE Credit settlement.
        </p>
      </div>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center rounded-lg bg-cope-orange px-3 text-xs font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create draft"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="inline-flex min-h-9 items-center rounded-lg border border-zinc-200/80 px-3 text-xs font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AdminMarketRow({
  market,
  actions,
}: {
  market: AdminMarketRow;
  actions: Array<{
    label: string;
    action: string;
    outcome?: MarketSide;
    requiresNotes?: boolean;
  }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<MarketSide>("believe");
  const [error, setError] = useState<string | null>(null);

  const publishWarnings = actions.some((item) => item.action === "publish")
    ? getPublishReadinessWarnings(market)
    : [];

  async function runAction(
    action: string,
    outcome?: MarketSide,
    requiresNotes?: boolean,
  ) {
    if (pending) return;

    setPending(action);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/markets/${encodeURIComponent(market.id)}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            outcome,
            resolutionNotes: requiresNotes ? notes : undefined,
          }),
        },
      );

      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Action failed.");
        return;
      }

      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <li className="border-b border-zinc-200/60 px-5 py-4 last:border-b-0 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {market.title}
            </p>
            <MarketStatusBadge dbStatus={market.status} closesAt={market.closesAt} />
            {isExpiredOpenMarket(market.status, market.closesAt) ? (
              <span className="rounded-full border border-orange-300/50 bg-orange-50/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-orange-800 dark:border-orange-400/25 dark:bg-orange-950/30 dark:text-orange-200">
                Past close time
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{market.roomBelief}</p>
          <CurationMeta market={market} />
          <MarketPools market={market} />
          <p className="mt-1 text-xs text-zinc-500">
            Closes {formatDateTime(market.closesAt)}
            {market.resolvesAt
              ? ` · Resolves ${formatDateTime(market.resolvesAt)}`
              : ""}
          </p>
          {market.resolutionCriteria ? (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
              Criteria: {market.resolutionCriteria}
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              No resolution criteria set.
            </p>
          )}
          {market.outcome ? (
            <p className="mt-1 text-xs font-medium text-cope-orange">
              Outcome: {market.outcome === "believe" ? "Believe" : "Cope"}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={`/room/${market.roomSlug}`}
              className="text-xs font-medium text-cope-orange hover:underline"
            >
              View room
            </Link>
            <Link
              href={`/room/${market.roomSlug}`}
              className="text-xs font-medium text-cope-orange hover:underline"
            >
              View public page
            </Link>
          </div>
          <MarketEditForm market={market} />
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="mt-3 space-y-2">
          {publishWarnings.length > 0 ? (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50/80 px-3 py-2 dark:border-amber-400/25 dark:bg-amber-950/30">
              <p className="text-[11px] font-medium text-amber-900 dark:text-amber-200">
                Publish warnings (not blocking):
              </p>
              <ul className="mt-1 list-inside list-disc text-[11px] text-amber-800 dark:text-amber-300">
                {publishWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {actions.some((item) => item.action === "resolve") ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-500">Outcome:</span>
              <button
                type="button"
                onClick={() => setSelectedOutcome("believe")}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                  selectedOutcome === "believe"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                }`}
              >
                Believe
              </button>
              <button
                type="button"
                onClick={() => setSelectedOutcome("cope")}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                  selectedOutcome === "cope"
                    ? "border-rose-400/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    : "border-zinc-200/80 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                }`}
              >
                Cope
              </button>
            </div>
          ) : null}

          {actions.some((item) => item.requiresNotes) ? (
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Resolution notes (optional)"
              className="w-full rounded-lg border border-zinc-200/80 bg-background px-3 py-2 text-xs dark:border-white/10"
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            {actions.map((item) => (
              <button
                key={item.action}
                type="button"
                disabled={pending !== null}
                onClick={() =>
                  void runAction(
                    item.action,
                    item.action === "resolve" ? selectedOutcome : item.outcome,
                    item.requiresNotes,
                  )
                }
                className="inline-flex min-h-8 items-center rounded-lg border border-zinc-200/80 px-2.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-900/[0.04] disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04]"
              >
                {pending === item.action ? "Working…" : item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-500">{error}</p> : null}
    </li>
  );
}

function MarketListSection({
  title,
  description,
  markets,
  getActions,
}: {
  title: string;
  description: string;
  markets: AdminMarketRow[];
  getActions: (market: AdminMarketRow) => Array<{
    label: string;
    action: string;
    outcome?: MarketSide;
    requiresNotes?: boolean;
  }>;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-background dark:border-white/[0.08]">
      <div className="border-b border-zinc-200/60 px-5 py-4 dark:border-white/[0.06]">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
      {markets.length === 0 ? (
        <p className="px-5 py-6 text-sm text-zinc-500">None.</p>
      ) : (
        <ul>
          {markets.map((market) => (
            <AdminMarketRow
              key={market.id}
              market={market}
              actions={getActions(market)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminMarketsSection({ data }: AdminMarketsSectionProps) {
  const router = useRouter();

  return (
    <div className="mt-4 space-y-6">
      <SeasonLaunchChecklist report={data.curationReport} />

      <section className="rounded-2xl border border-zinc-200/80 bg-background dark:border-white/[0.08]">
        <div className="border-b border-zinc-200/60 px-5 py-4 dark:border-white/[0.06]">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Candidate rooms
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Marked as market candidates with no market yet.
          </p>
        </div>
        {data.candidates.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-500">No candidates.</p>
        ) : (
          <ul>
            {data.candidates.map((candidate) => (
              <li
                key={candidate.roomId}
                className="border-b border-zinc-200/60 px-5 py-4 last:border-b-0 dark:border-white/[0.06]"
              >
                <Link
                  href={`/room/${candidate.slug}`}
                  className="text-sm font-medium text-zinc-900 hover:text-cope-orange dark:text-zinc-100"
                >
                  {candidate.belief}
                </Link>
                <p className="mt-1 text-xs text-zinc-500">
                  {candidate.challengeCount} challenges
                </p>
                <CreateMarketForm
                  candidate={candidate}
                  onCreated={() => router.refresh()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <MarketListSection
          title="Draft markets"
          description="Created but not yet open for staking."
          markets={data.drafts}
          getActions={() => [
            { label: "Publish", action: "publish" },
            { label: "Void", action: "void", requiresNotes: true },
          ]}
        />
        <MarketListSection
          title="Open markets"
          description="Live markets accepting stakes. Markets past their close time should be manually closed and resolved."
          markets={data.open}
          getActions={() => [
            { label: "Close", action: "close" },
            { label: "Void", action: "void", requiresNotes: true },
          ]}
        />
        <MarketListSection
          title="Closed — awaiting resolution"
          description="Staking has ended. Close expired-open markets here, then resolve or void."
          markets={data.closed}
          getActions={() => [
            { label: "Resolve", action: "resolve", requiresNotes: true },
            { label: "Void", action: "void", requiresNotes: true },
          ]}
        />
        <MarketListSection
          title="Resolved / voided"
          description="Settled markets."
          markets={data.terminal}
          getActions={() => []}
        />
      </div>
    </div>
  );
}
