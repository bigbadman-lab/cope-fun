"use client";

import { useEffect, useRef } from "react";
import { useAppAuth } from "@/hooks/use-app-auth";
import { getAnonymousSessionToken } from "@/lib/anonymous-token";

const WALLET_SYNC_RETRY_MS = 3500;
const MAX_WALLET_SYNC_ATTEMPTS = 3;

type SyncResponse =
  | {
      ok: true;
      user?: {
        walletAddress?: string | null;
      };
    }
  | { ok: false };

export function AuthSync() {
  const { ready, authenticated, authFetch } = useAppAuth();
  const attemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) {
      attemptRef.current = 0;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    async function sync() {
      try {
        const response = await authFetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonymousToken: getAnonymousSessionToken(),
          }),
        });

        if (cancelled) return;

        const payload = (await response.json()) as SyncResponse;
        const walletAddress =
          payload.ok === true ? (payload.user?.walletAddress ?? null) : null;

        if (response.ok && walletAddress) {
          attemptRef.current = 0;
          return;
        }

        if (
          response.ok &&
          !walletAddress &&
          attemptRef.current < MAX_WALLET_SYNC_ATTEMPTS - 1
        ) {
          attemptRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) void sync();
          }, WALLET_SYNC_RETRY_MS);
          return;
        }

        attemptRef.current = 0;
      } catch {
        if (cancelled) return;

        if (attemptRef.current < MAX_WALLET_SYNC_ATTEMPTS - 1) {
          attemptRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) void sync();
          }, WALLET_SYNC_RETRY_MS);
        }
      }
    }

    void sync();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [ready, authenticated, authFetch]);

  return null;
}
