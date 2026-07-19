"use client";

import { useSyncExternalStore } from "react";

/**
 * Temporary local follow gating only — NOT a real wallet.
 *
 * Do not use for markets, Swarm Credits, staking, leaderboard, or Privy auth.
 * Real wallet identity lives on `app_users.wallet_address` via Privy.
 */
export type WalletSession = {
  connected: boolean;
  address: string | null;
  connectedAt: string | null;
};

const STORAGE_KEY = "cope-fun:wallet-session";

const DISCONNECTED_SESSION: WalletSession = {
  connected: false,
  address: null,
  connectedAt: null,
};

let sessionSnapshot = DISCONNECTED_SESSION;
let sessionSnapshotRaw: string | null = null;
const listeners = new Set<() => void>();

function invalidateSnapshot() {
  sessionSnapshotRaw = null;
}

function normalizeSession(value: Partial<WalletSession> | null): WalletSession {
  if (!value?.connected || !value.address) {
    return DISCONNECTED_SESSION;
  }

  return {
    connected: true,
    address: value.address,
    connectedAt: value.connectedAt ?? null,
  };
}

function refreshSnapshot(): WalletSession {
  if (typeof window === "undefined") return DISCONNECTED_SESSION;

  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === sessionSnapshotRaw) return sessionSnapshot;

  sessionSnapshotRaw = raw;

  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<WalletSession>) : null;
    sessionSnapshot = normalizeSession(parsed);
  } catch {
    sessionSnapshot = DISCONNECTED_SESSION;
  }

  return sessionSnapshot;
}

function notifyListeners() {
  invalidateSnapshot();
  refreshSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeWalletSession(listener: () => void) {
  listeners.add(listener);

  const onStorage = () => notifyListeners();
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getWalletSessionSnapshot(): WalletSession {
  return refreshSnapshot();
}

export const WALLET_SESSION_SERVER_SNAPSHOT = DISCONNECTED_SESSION;

function writeSession(session: WalletSession) {
  if (typeof window === "undefined") return;

  if (!session.connected) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  notifyListeners();
}

function createMockAddress(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `cope_${suffix}`;
}

/** Enables local room follow only — not on-chain or Privy wallet connect. */
export function connectMockWallet(): WalletSession {
  const session: WalletSession = {
    connected: true,
    address: createMockAddress(),
    connectedAt: new Date().toISOString(),
  };
  writeSession(session);
  return session;
}

export function disconnectMockWallet(): WalletSession {
  writeSession(DISCONNECTED_SESSION);
  return DISCONNECTED_SESSION;
}

export function useWalletSession() {
  return useSyncExternalStore(
    subscribeWalletSession,
    getWalletSessionSnapshot,
    () => WALLET_SESSION_SERVER_SNAPSHOT,
  );
}

export function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
