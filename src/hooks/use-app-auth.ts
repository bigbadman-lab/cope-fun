"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";
import { formatAppUserLabel } from "@/lib/auth/display-label";

export function useAppAuth() {
  const { ready, authenticated, user, login, logout, getAccessToken } =
    usePrivy();

  const walletAddress =
    user?.wallet?.address ??
    user?.linkedAccounts?.find(
      (account) => account.type === "wallet" && "address" in account,
    )?.address ??
    null;

  const email =
    user?.email?.address ??
    user?.linkedAccounts?.find(
      (account) => account.type === "email" && "address" in account,
    )?.address ??
    null;

  const displayLabel = user
    ? formatAppUserLabel({
        id: user.id,
        displayName: null,
        walletAddress: typeof walletAddress === "string" ? walletAddress : null,
        email: typeof email === "string" ? email : null,
      })
    : null;

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await getAccessToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [getAccessToken]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const authHeaders = await getAuthHeaders();
      return fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          ...authHeaders,
        },
      });
    },
    [getAuthHeaders],
  );

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken,
    displayLabel,
    walletAddress: typeof walletAddress === "string" ? walletAddress : null,
    getAuthHeaders,
    authFetch,
  };
}
