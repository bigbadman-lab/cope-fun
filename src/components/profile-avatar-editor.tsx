"use client";

import { useCallback, useRef, useState } from "react";
import { resizeAvatarImage } from "@/lib/avatar-utils";
import { AVATAR_PRESETS } from "@/lib/avatar-presets";
import {
  clearUserAvatar,
  setUserAvatar,
  useActiveUserProfile,
  type UserAvatar,
} from "@/lib/user-profile";
import { useWalletSession } from "@/lib/wallet-session";
import { UserAvatarVisual } from "./user-avatar-visual";

export function ProfileAvatarEditor() {
  const wallet = useWalletSession();
  const profile = useActiveUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const address = wallet.address;
  const currentAvatar: UserAvatar = profile?.avatar ?? { type: "default" };

  const saveAvatar = useCallback(
    (avatar: UserAvatar) => {
      if (!address) return;
      try {
        setUserAvatar(address, avatar);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save avatar.");
      }
    },
    [address],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !address) return;

      setUploading(true);
      setError(null);

      try {
        const dataUrl = await resizeAvatarImage(file);
        saveAvatar({ type: "upload", dataUrl });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [address, saveAvatar],
  );

  const handlePreset = useCallback(
    (presetId: string) => {
      saveAvatar({ type: "preset", presetId });
    },
    [saveAvatar],
  );

  const handleReset = useCallback(() => {
    if (!address) return;
    clearUserAvatar(address);
    setError(null);
  }, [address]);

  if (!wallet.connected || !address) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <UserAvatarVisual avatar={currentAvatar} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your avatar appears on your messages in rooms.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex min-h-10 items-center rounded-xl border border-zinc-200/80 bg-background px-3.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-background dark:text-zinc-200 dark:hover:bg-white/[0.04]"
        >
          {uploading ? "Uploading…" : "Upload photo"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Reset to default
        </button>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_PRESETS.map((preset) => {
            const active =
              currentAvatar.type === "preset" &&
              currentAvatar.presetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset.id)}
                aria-label={`Use ${preset.label} avatar`}
                aria-pressed={active}
                className={`rounded-lg p-0.5 transition-colors ${
                  active
                    ? "ring-2 ring-cope-orange/70 ring-offset-2 ring-offset-background"
                    : "ring-1 ring-zinc-200/80 dark:ring-white/10"
                }`}
              >
                <UserAvatarVisual
                  avatar={{ type: "preset", presetId: preset.id }}
                  size="sm"
                />
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
