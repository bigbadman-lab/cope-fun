"use client";

import { useSyncExternalStore } from "react";

/**
 * Local follow list — maps to `room_follows` (+ `users`, `rooms`) when backed by DB.
 * Separate from `cope-fun:saved-conversations` (device archive / created rooms).
 */
export type FollowedRoom = {
  slug: string;
  roomId: string | null;
  belief: string;
  followedAt: string;
};

export type FollowedRoomsStore = {
  version: 1;
  rooms: FollowedRoom[];
};

const STORAGE_KEY = "cope-fun:followed-rooms";

const EMPTY_STORE: FollowedRoomsStore = { version: 1, rooms: [] };

let storeSnapshot = EMPTY_STORE;
let storeSnapshotRaw: string | null = null;
const listeners = new Set<() => void>();

function invalidateSnapshot() {
  storeSnapshotRaw = null;
}

function normalizeStore(value: unknown): FollowedRoomsStore {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as FollowedRoomsStore).rooms)
  ) {
    return EMPTY_STORE;
  }

  const rooms = (value as FollowedRoomsStore).rooms
    .filter(
      (room): room is FollowedRoom =>
        typeof room?.slug === "string" &&
        room.slug.length > 0 &&
        typeof room.belief === "string",
    )
    .map((room) => ({
      slug: room.slug,
      roomId: room.roomId ?? null,
      belief: room.belief,
      followedAt: room.followedAt ?? new Date().toISOString(),
    }));

  const deduped = new Map<string, FollowedRoom>();
  for (const room of rooms) {
    deduped.set(room.slug, room);
  }

  return {
    version: 1,
    rooms: [...deduped.values()].sort(
      (a, b) =>
        new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime(),
    ),
  };
}

function refreshSnapshot(): FollowedRoomsStore {
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

export function subscribeFollowedRooms(listener: () => void) {
  listeners.add(listener);

  const onStorage = () => notifyListeners();
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getFollowedRoomsSnapshot(): FollowedRoom[] {
  return refreshSnapshot().rooms;
}

export const FOLLOWED_ROOMS_SERVER_SNAPSHOT: FollowedRoom[] = [];

function readStore(): FollowedRoomsStore {
  if (typeof window === "undefined") return EMPTY_STORE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    return normalizeStore(JSON.parse(raw));
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: FollowedRoomsStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  notifyListeners();
}

export function isRoomFollowed(slug: string): boolean {
  return readStore().rooms.some((room) => room.slug === slug);
}

export function followRoom(input: {
  slug: string;
  roomId?: string | null;
  belief: string;
}): FollowedRoom {
  const store = readStore();
  const existing = store.rooms.find((room) => room.slug === input.slug);

  const followed: FollowedRoom = {
    slug: input.slug,
    roomId: input.roomId ?? existing?.roomId ?? null,
    belief: input.belief.trim() || existing?.belief || "Unknown belief",
    followedAt: existing?.followedAt ?? new Date().toISOString(),
  };

  const rooms = [
    followed,
    ...store.rooms.filter((room) => room.slug !== input.slug),
  ];

  writeStore({ version: 1, rooms });
  return followed;
}

export function unfollowRoom(slug: string): void {
  const store = readStore();
  const rooms = store.rooms.filter((room) => room.slug !== slug);
  if (rooms.length === store.rooms.length) return;
  writeStore({ version: 1, rooms });
}

export function toggleFollowRoom(input: {
  slug: string;
  roomId?: string | null;
  belief: string;
}): boolean {
  if (isRoomFollowed(input.slug)) {
    unfollowRoom(input.slug);
    return false;
  }

  followRoom(input);
  return true;
}

export function useFollowedRooms() {
  return useSyncExternalStore(
    subscribeFollowedRooms,
    getFollowedRoomsSnapshot,
    () => FOLLOWED_ROOMS_SERVER_SNAPSHOT,
  );
}

export function formatFollowedDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
