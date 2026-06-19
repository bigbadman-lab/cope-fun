"use client";

import { useSyncExternalStore } from "react";

/**
 * Local guest belief quota — maps to per-user usage limits when backed by auth/DB.
 * Separate from `cope-fun:wallet-session` and `cope-fun:saved-conversations`.
 */
export type GuestBeliefUsage = {
  version: 1;
  beliefCount: number;
  firstBeliefAt: string | null;
  lastBeliefAt: string | null;
};

const STORAGE_KEY = "cope-fun:guest-belief-usage";
const MAX_GUEST_BELIEFS = 1;

const EMPTY_USAGE: GuestBeliefUsage = {
  version: 1,
  beliefCount: 0,
  firstBeliefAt: null,
  lastBeliefAt: null,
};

let usageSnapshot = EMPTY_USAGE;
let usageSnapshotRaw: string | null = null;
const listeners = new Set<() => void>();

function invalidateSnapshot() {
  usageSnapshotRaw = null;
}

function normalizeUsage(value: unknown): GuestBeliefUsage {
  if (!value || typeof value !== "object") {
    return EMPTY_USAGE;
  }

  const raw = value as GuestBeliefUsage;
  const beliefCount =
    typeof raw.beliefCount === "number"
      ? Math.max(0, Math.floor(raw.beliefCount))
      : 0;

  return {
    version: 1,
    beliefCount,
    firstBeliefAt:
      typeof raw.firstBeliefAt === "string" ? raw.firstBeliefAt : null,
    lastBeliefAt: typeof raw.lastBeliefAt === "string" ? raw.lastBeliefAt : null,
  };
}

function refreshSnapshot(): GuestBeliefUsage {
  if (typeof window === "undefined") return EMPTY_USAGE;

  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === usageSnapshotRaw) return usageSnapshot;

  usageSnapshotRaw = raw;

  try {
    const parsed = raw ? JSON.parse(raw) : null;
    usageSnapshot = normalizeUsage(parsed);
  } catch {
    usageSnapshot = EMPTY_USAGE;
  }

  return usageSnapshot;
}

function notifyListeners() {
  invalidateSnapshot();
  refreshSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeGuestBeliefUsage(listener: () => void) {
  listeners.add(listener);

  const onStorage = () => notifyListeners();
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getGuestBeliefUsageSnapshot(): GuestBeliefUsage {
  return refreshSnapshot();
}

export const GUEST_BELIEF_USAGE_SERVER_SNAPSHOT = EMPTY_USAGE;

function readUsage(): GuestBeliefUsage {
  if (typeof window === "undefined") return EMPTY_USAGE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_USAGE;
    return normalizeUsage(JSON.parse(raw));
  } catch {
    return EMPTY_USAGE;
  }
}

function writeUsage(usage: GuestBeliefUsage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    notifyListeners();
  } catch {
    throw new Error("Could not save guest usage.");
  }
}

export function canGuestCreateBelief(): boolean {
  return readUsage().beliefCount < MAX_GUEST_BELIEFS;
}

export function recordGuestBeliefCreated(): GuestBeliefUsage {
  const current = readUsage();
  const now = new Date().toISOString();

  const next: GuestBeliefUsage = {
    version: 1,
    beliefCount: current.beliefCount + 1,
    firstBeliefAt: current.firstBeliefAt ?? now,
    lastBeliefAt: now,
  };

  writeUsage(next);
  return next;
}

export function resetGuestBeliefUsage(): void {
  writeUsage(EMPTY_USAGE);
}

export function useGuestBeliefUsage() {
  return useSyncExternalStore(
    subscribeGuestBeliefUsage,
    getGuestBeliefUsageSnapshot,
    () => GUEST_BELIEF_USAGE_SERVER_SNAPSHOT,
  );
}
