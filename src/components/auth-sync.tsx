"use client";

import { useEffect, useRef } from "react";
import { useAppAuth } from "@/hooks/use-app-auth";
import { getAnonymousSessionToken } from "@/lib/anonymous-token";

export function AuthSync() {
  const { ready, authenticated, authFetch } = useAppAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated) {
      syncedRef.current = false;
      return;
    }

    if (syncedRef.current) return;

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

        if (!cancelled && response.ok) {
          syncedRef.current = true;
        }
      } catch {
        // Retry on next authenticated mount cycle.
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, authFetch]);

  return null;
}
