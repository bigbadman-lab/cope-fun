"use client";

const ANONYMOUS_SESSION_TOKEN_KEY = "cope-fun:anonymous-session-token";

function createAnonymousToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getAnonymousSessionToken(): string {
  let token = localStorage.getItem(ANONYMOUS_SESSION_TOKEN_KEY);
  if (!token) {
    token = createAnonymousToken();
    localStorage.setItem(ANONYMOUS_SESSION_TOKEN_KEY, token);
  }
  return token;
}
