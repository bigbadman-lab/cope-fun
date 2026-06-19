"use client";

import { useSyncExternalStore } from "react";
import {
  getWalletSessionSnapshot,
  subscribeWalletSession,
  WALLET_SESSION_SERVER_SNAPSHOT,
} from "@/lib/wallet-session";

/**
 * Local user profiles — maps to `users` (+ avatar fields) when backed by DB.
 * Keyed by wallet address; separate from `cope-fun:wallet-session`.
 */
export type UserAvatar =
  | { type: "default" }
  | { type: "preset"; presetId: string }
  | { type: "upload"; dataUrl: string };

export type UserProfile = {
  address: string;
  displayName?: string;
  avatar: UserAvatar;
  updatedAt: string;
};

export type UserProfilesStore = {
  version: 1;
  profiles: Record<string, UserProfile>;
};

const STORAGE_KEY = "cope-fun:user-profiles";

const EMPTY_STORE: UserProfilesStore = { version: 1, profiles: {} };

let storeSnapshot = EMPTY_STORE;
let storeSnapshotRaw: string | null = null;
const listeners = new Set<() => void>();

function invalidateSnapshot() {
  storeSnapshotRaw = null;
}

function normalizeAvatar(value: unknown): UserAvatar {
  if (!value || typeof value !== "object") {
    return { type: "default" };
  }

  const avatar = value as UserAvatar;

  if (avatar.type === "preset" && typeof avatar.presetId === "string") {
    return { type: "preset", presetId: avatar.presetId };
  }

  if (avatar.type === "upload" && typeof avatar.dataUrl === "string") {
    return { type: "upload", dataUrl: avatar.dataUrl };
  }

  return { type: "default" };
}

function normalizeStore(value: unknown): UserProfilesStore {
  if (!value || typeof value !== "object") {
    return EMPTY_STORE;
  }

  const rawProfiles = (value as UserProfilesStore).profiles;
  if (!rawProfiles || typeof rawProfiles !== "object") {
    return EMPTY_STORE;
  }

  const profiles: Record<string, UserProfile> = {};

  for (const [address, profile] of Object.entries(rawProfiles)) {
    if (!profile || typeof profile !== "object" || typeof address !== "string") {
      continue;
    }

    profiles[address] = {
      address,
      displayName:
        typeof profile.displayName === "string" ? profile.displayName : undefined,
      avatar: normalizeAvatar(profile.avatar),
      updatedAt:
        typeof profile.updatedAt === "string"
          ? profile.updatedAt
          : new Date().toISOString(),
    };
  }

  return { version: 1, profiles };
}

function refreshSnapshot(): UserProfilesStore {
  if (typeof window === "undefined") return EMPTY_STORE;

  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === storeSnapshotRaw) return storeSnapshot;

  storeSnapshotRaw = raw;

  try {
    const parsed = raw ? JSON.parse(raw) : null;
    storeSnapshot = normalizeStore(parsed);
  } catch {
    storeSnapshot = EMPTY_STORE;
  }

  return storeSnapshot;
}

function notifyListeners() {
  invalidateSnapshot();
  refreshSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeUserProfiles(listener: () => void) {
  listeners.add(listener);

  const onStorage = () => notifyListeners();
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getUserProfilesSnapshot(): UserProfilesStore {
  return refreshSnapshot();
}

export const USER_PROFILES_SERVER_SNAPSHOT = EMPTY_STORE;

function readStore(): UserProfilesStore {
  if (typeof window === "undefined") return EMPTY_STORE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    return normalizeStore(JSON.parse(raw));
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: UserProfilesStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    notifyListeners();
  } catch {
    throw new Error("Could not save avatar. Storage may be full.");
  }
}

export function getUserProfile(address: string): UserProfile | null {
  if (!address) return null;
  return readStore().profiles[address] ?? null;
}

export function getActiveUserProfile(): UserProfile | null {
  const session = getWalletSessionSnapshot();
  if (!session.connected || !session.address) return null;
  return getUserProfile(session.address);
}

export function setUserAvatar(address: string, avatar: UserAvatar): UserProfile {
  if (!address) {
    throw new Error("Wallet address is required to save an avatar.");
  }

  const store = readStore();
  const existing = store.profiles[address];

  const profile: UserProfile = {
    address,
    displayName: existing?.displayName,
    avatar,
    updatedAt: new Date().toISOString(),
  };

  writeStore({
    version: 1,
    profiles: {
      ...store.profiles,
      [address]: profile,
    },
  });

  return profile;
}

export function clearUserAvatar(address: string): void {
  setUserAvatar(address, { type: "default" });
}

export function useActiveUserProfile() {
  const session = useSyncExternalStore(
    subscribeWalletSession,
    getWalletSessionSnapshot,
    () => WALLET_SESSION_SERVER_SNAPSHOT,
  );

  const profiles = useSyncExternalStore(
    subscribeUserProfiles,
    getUserProfilesSnapshot,
    () => USER_PROFILES_SERVER_SNAPSHOT,
  );

  if (!session.connected || !session.address) return null;
  return profiles.profiles[session.address] ?? null;
}

export function useUserProfiles() {
  return useSyncExternalStore(
    subscribeUserProfiles,
    getUserProfilesSnapshot,
    () => USER_PROFILES_SERVER_SNAPSHOT,
  );
}
