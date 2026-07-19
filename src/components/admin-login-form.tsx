"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminLoginFormProps = {
  adminConfigured: boolean;
};

export function AdminLoginForm({ adminConfigured }: AdminLoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminConfigured || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? "Could not sign in.");
        return;
      }

      setPassword("");
      router.refresh();
    } catch {
      setError("Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200/80 bg-surface p-6 shadow-sm dark:border-white/[0.08] dark:bg-surface">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Enter the admin password to view Hoodswarm product metrics.
        </p>

        {!adminConfigured ? (
          <p className="mt-6 rounded-xl border border-orange-200/80 bg-orange-50/80 px-4 py-3 text-sm text-orange-900 dark:border-orange-400/20 dark:bg-orange-950/30 dark:text-orange-100">
            Admin access is not configured. Set <code>ADMIN_SECRET</code> in the
            environment.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-zinc-200/80 bg-background px-4 py-3 text-sm text-zinc-900 outline-none transition-shadow focus:border-cope-orange/40 focus:shadow-[var(--belief-input-focus-shadow)] dark:border-white/10 dark:text-zinc-100"
              />
            </div>

            {error ? (
              <p className="text-sm text-orange-700 dark:text-orange-200" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
