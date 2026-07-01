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
import type {
  ProfileDashboard,
  ProfileUserSummary,
} from "@/lib/profile/types";

export type AccountAvatarState = {
  label: string;
  avatarColor: string | null;
  avatarUrl: string | null;
  avatarPublicUrl: string | null;
  avatarUpdatedAt: string | null;
};

type ProfileMeResponse =
  | ({ ok: true } & ProfileDashboard & {
      disclaimers?: { credits: string };
    })
  | { ok: false; error?: string };

type AccountAvatarContextValue = {
  avatar: AccountAvatarState | null;
  dashboard: ProfileDashboard | null;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
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

function toDashboard(
  payload: Extract<ProfileMeResponse, { ok: true }>,
): ProfileDashboard {
  return {
    user: payload.user,
    season: payload.season,
    account: payload.account,
    activePositions: payload.activePositions,
    activePulsePositions: payload.activePulsePositions ?? [],
    resolvedPositions: payload.resolvedPositions,
    createdRooms: payload.createdRooms,
  };
}

function fallbackAvatarState(label: string): AccountAvatarState {
  return {
    label,
    avatarColor: null,
    avatarUrl: null,
    avatarPublicUrl: null,
    avatarUpdatedAt: null,
  };
}

export function AccountAvatarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, displayLabel, authFetch } = useAppAuth();
  const [avatar, setAvatar] = useState<AccountAvatarState | null>(null);
  const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!authenticated) return;

    setProfileLoading(true);
    setProfileError(null);

    try {
      const response = await authFetch("/api/profile/me");
      const payload = (await response.json()) as ProfileMeResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok === false
            ? (payload.error ?? "Could not load profile.")
            : "Could not load profile.",
        );
      }

      const nextDashboard = toDashboard(payload);
      setDashboard(nextDashboard);
      setAvatar(toAvatarState(payload.user));
    } catch (error) {
      setDashboard(null);
      setProfileError(
        error instanceof Error ? error.message : "Could not load profile.",
      );

      if (displayLabel) {
        setAvatar((current) => current ?? fallbackAvatarState(displayLabel));
      }
    } finally {
      setProfileLoading(false);
    }
  }, [authenticated, authFetch, displayLabel]);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      setAvatar(null);
      setDashboard(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    void refreshProfile();
  }, [ready, authenticated, refreshProfile]);

  const applyAvatarFromUser = useCallback((user: ProfileUserSummary) => {
    setAvatar(toAvatarState(user));
    setDashboard((current) => (current ? { ...current, user } : current));
  }, []);

  const applyAvatarPatch = useCallback((patch: Partial<AccountAvatarState>) => {
    setAvatar((current) => (current ? { ...current, ...patch } : current));
    setDashboard((current) => {
      if (!current) return current;

      return {
        ...current,
        user: {
          ...current.user,
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          ...(patch.avatarColor !== undefined
            ? { avatarColor: patch.avatarColor }
            : {}),
          ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
          ...(patch.avatarPublicUrl !== undefined
            ? { avatarPublicUrl: patch.avatarPublicUrl }
            : {}),
          ...(patch.avatarUpdatedAt !== undefined
            ? { avatarUpdatedAt: patch.avatarUpdatedAt }
            : {}),
        },
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      avatar,
      dashboard,
      profileLoading,
      profileError,
      refreshProfile,
      refreshAvatar: refreshProfile,
      applyAvatarFromUser,
      applyAvatarPatch,
    }),
    [
      avatar,
      dashboard,
      profileLoading,
      profileError,
      refreshProfile,
      applyAvatarFromUser,
      applyAvatarPatch,
    ],
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
