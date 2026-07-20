"use client";

type OnboardingCompletion = {
  version: 1;
  completedAt: string;
};

const STORAGE_KEY = "hoodswarm:onboarding:v1";

function normalizeCompletion(value: unknown): OnboardingCompletion | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as OnboardingCompletion;
  if (raw.version !== 1 || typeof raw.completedAt !== "string") return null;

  return {
    version: 1,
    completedAt: raw.completedAt,
  };
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return normalizeCompletion(JSON.parse(raw)) !== null;
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;

  const payload: OnboardingCompletion = {
    version: 1,
    completedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable — dismiss for this session without blocking the site.
  }
}
