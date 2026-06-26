"use client";

import { useCallback, useRef, useState } from "react";
import { SubmitButtonLoader } from "./belief-input";
import { UserAccountAvatar } from "./user-account-avatar";
import { useAccountAvatar } from "./account-avatar-provider";
import { useAppAuth } from "@/hooks/use-app-auth";
import { resizeAvatarImage } from "@/lib/avatar-utils";
import {
  AVATAR_PRESET_COLORS,
  type AvatarPresetColorId,
} from "@/lib/profile/avatar-colors";
import type { ProfileUserSummary } from "@/lib/profile/types";

type ProfileAvatarCustomizerProps = {
  user: ProfileUserSummary;
  onUserUpdated: (user: ProfileUserSummary) => void;
};

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header?.match(/data:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

export function ProfileAvatarCustomizer({
  user,
  onUserUpdated,
}: ProfileAvatarCustomizerProps) {
  const { authFetch } = useAppAuth();
  const { applyAvatarPatch } = useAccountAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyAvatarResponse = useCallback(
    (avatar: {
      avatarColor: string | null;
      avatarUrl: string | null;
      avatarPublicUrl: string | null;
      avatarUpdatedAt: string | null;
    }) => {
      const nextUser: ProfileUserSummary = {
        ...user,
        avatarColor: avatar.avatarColor,
        avatarUrl: avatar.avatarUrl,
        avatarPublicUrl: avatar.avatarPublicUrl,
        avatarUpdatedAt: avatar.avatarUpdatedAt,
      };

      onUserUpdated(nextUser);
      applyAvatarPatch({
        label: nextUser.label,
        avatarColor: nextUser.avatarColor,
        avatarUrl: nextUser.avatarUrl,
        avatarPublicUrl: nextUser.avatarPublicUrl,
        avatarUpdatedAt: nextUser.avatarUpdatedAt,
      });
    },
    [applyAvatarPatch, onUserUpdated, user],
  );

  const handlePresetSelect = useCallback(
    async (colorId: AvatarPresetColorId) => {
      if (saving) return;

      setSaving(true);
      setError(null);
      setMessage(null);

      try {
        const response = await authFetch("/api/profile/avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar_color: colorId }),
        });
        const payload = (await response.json()) as {
          ok: boolean;
          avatar?: {
            avatarColor: string | null;
            avatarUrl: string | null;
            avatarPublicUrl: string | null;
            avatarUpdatedAt: string | null;
          };
          error?: string;
        };

        if (!response.ok || !payload.ok || !payload.avatar) {
          throw new Error(payload.error ?? "Could not update avatar colour.");
        }

        applyAvatarResponse(payload.avatar);
        setMessage("Avatar colour updated.");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not update avatar colour.",
        );
      } finally {
        setSaving(false);
      }
    },
    [applyAvatarResponse, authFetch, saving],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || saving) return;

      setSaving(true);
      setError(null);
      setMessage(null);

      try {
        const dataUrl = await resizeAvatarImage(file);
        const uploadFile = dataUrlToFile(dataUrl, "avatar.jpg");
        const formData = new FormData();
        formData.append("file", uploadFile);

        const response = await authFetch("/api/profile/avatar", {
          method: "PATCH",
          body: formData,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          avatar?: {
            avatarColor: string | null;
            avatarUrl: string | null;
            avatarPublicUrl: string | null;
            avatarUpdatedAt: string | null;
          };
          error?: string;
        };

        if (!response.ok || !payload.ok || !payload.avatar) {
          throw new Error(payload.error ?? "Could not upload avatar.");
        }

        applyAvatarResponse(payload.avatar);
        setMessage("Avatar uploaded.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not upload avatar.");
      } finally {
        setSaving(false);
      }
    },
    [applyAvatarResponse, authFetch, saving],
  );

  const handleRemovePhoto = useCallback(async () => {
    if (saving || !user.avatarPublicUrl) return;

    const confirmed = window.confirm(
      "Remove your uploaded photo? Your preset avatar colour will be shown instead.",
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authFetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removePhoto: true }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        avatar?: {
          avatarColor: string | null;
          avatarUrl: string | null;
          avatarPublicUrl: string | null;
          avatarUpdatedAt: string | null;
        };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.avatar) {
        throw new Error(payload.error ?? "Could not remove avatar photo.");
      }

      applyAvatarResponse(payload.avatar);
      setMessage("Photo removed.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove avatar photo.",
      );
    } finally {
      setSaving(false);
    }
  }, [applyAvatarResponse, authFetch, saving, user.avatarPublicUrl]);

  return (
    <section className="mb-6 rounded-xl border border-zinc-200/70 bg-surface/50 px-4 py-4 dark:border-white/[0.07] dark:bg-surface/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Customize avatar
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Shown on your profile and account chip.
          </p>
        </div>
        <UserAccountAvatar
          label={user.label}
          avatarColor={user.avatarColor}
          avatarPublicUrl={user.avatarPublicUrl}
          avatarUpdatedAt={user.avatarUpdatedAt}
          size="md"
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Preset colours
        </p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_PRESET_COLORS.map((color) => {
            const active = user.avatarColor === color.id;

            return (
              <button
                key={color.id}
                type="button"
                disabled={saving}
                aria-label={`Use ${color.label} avatar colour`}
                aria-pressed={active}
                onClick={() => void handlePresetSelect(color.id)}
                className={`rounded-full p-0.5 transition-[transform,box-shadow] duration-150 ${
                  active
                    ? "ring-2 ring-cope-orange/70 ring-offset-2 ring-offset-background"
                    : "ring-1 ring-zinc-200/80 dark:ring-white/10"
                }`}
              >
                <span
                  className="block size-8 rounded-full"
                  style={{ backgroundColor: color.background }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => fileInputRef.current?.click()}
          aria-busy={saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-200/80 bg-background px-3.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-background dark:text-zinc-200 dark:hover:bg-white/[0.04]"
        >
          {saving ? <SubmitButtonLoader /> : null}
          {saving ? "Saving…" : "Upload photo"}
        </button>
        {user.avatarPublicUrl ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleRemovePhoto()}
            className="inline-flex min-h-10 items-center rounded-xl border border-rose-200/70 bg-background px-3.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/30 dark:bg-background dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            Remove photo
          </button>
        ) : null}
        <p className="text-xs text-zinc-500">JPEG, PNG, or WebP · max 2MB</p>
      </div>

      {message && (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
