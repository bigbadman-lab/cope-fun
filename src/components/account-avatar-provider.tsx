"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppAuth } from "@/hooks/use-app-auth";
import type { ProfileUserSummary } from "@/lib/profile/types";

export type AccountAvatarState = {
  label: string;
  avatarColor: string | null;
  avatarUrl: string | null;
  avatarPublicUrl: string | null;
  avatarUpdatedAt: string | null;
};

type AccountAvatarContextValue = {
  avatar: AccountAvatarState | null;
  refreshAvatar: () => Promise<void>;
  applyAvatarFromUser: (user: ProfileUserSummary) => void;
  applyAvatarPatch: (patch: Partial<AccountAvatarState>) => void;
};

const AccountAvatarContext = createContext<AccountAvatarContextValue | null>(
  null,
);

function toAvatarState(user: ProfileUserSummary): AccountAvatarState {
  return {
    label: user.label,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    avatarPublicUrl: user.avatarPublicUrl,
    avatarUpdatedAt: user.avatarUpdatedAt,
  };
}

async function fetchAvatarState(
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): Promise<AccountAvatarState | null> {
  const response = await authFetch("/api/profile/me");
  const payload = (await response.json()) as {
    ok?: boolean;
    user?: ProfileUserSummary;
  };

  if (response.ok && payload.ok && payload.user) {
    return toAvatarState(payload.user);
  }

  return null;
}

export function AccountAvatarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, displayLabel, authFetch } = useAppAuth();
  const [avatar, setAvatar] = useState<AccountAvatarState | null>(null);

  const refreshAvatar = useCallback(async () => {
    if (!authenticated) return;

    try {
      const next = await fetchAvatarState(authFetch);
      if (next) {
        setAvatar(next);
      }
    } catch {
      if (displayLabel) {
        setAvatar((current) =>
          current ?? {
            label: displayLabel,
            avatarColor: null,
            avatarUrl: null,
            avatarPublicUrl: null,
            avatarUpdatedAt: null,
          },
        );
      }
    }
  }, [authenticated, authFetch, displayLabel]);

  useEffect(() => {
    if (!ready || !authenticated) return;

    let cancelled = false;

    fetchAvatarState(authFetch)
      .then((next) => {
        if (!cancelled && next) {
          setAvatar(next);
        }
      })
      .catch(() => {
        if (!cancelled && displayLabel) {
          setAvatar((current) =>
            current ?? {
              label: displayLabel,
              avatarColor: null,
              avatarUrl: null,
              avatarPublicUrl: null,
              avatarUpdatedAt: null,
            },
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, authFetch, displayLabel]);

  const applyAvatarFromUser = useCallback((user: ProfileUserSummary) => {
    setAvatar(toAvatarState(user));
  }, []);

  const applyAvatarPatch = useCallback((patch: Partial<AccountAvatarState>) => {
    setAvatar((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({
      avatar,
      refreshAvatar,
      applyAvatarFromUser,
      applyAvatarPatch,
    }),
    [avatar, refreshAvatar, applyAvatarFromUser, applyAvatarPatch],
  );

  return (
    <AccountAvatarContext.Provider value={value}>
      {children}
    </AccountAvatarContext.Provider>
  );
}

export function useAccountAvatar() {
  const context = useContext(AccountAvatarContext);
  if (!context) {
    throw new Error("useAccountAvatar must be used within AccountAvatarProvider");
  }
  return context;
}

export function useOptionalAccountAvatar() {
  return useContext(AccountAvatarContext);
}
