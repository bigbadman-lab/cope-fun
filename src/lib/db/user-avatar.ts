import "server-only";
import type { AppUser } from "@/lib/auth/app-user";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  buildAvatarStoragePath,
  USER_AVATARS_BUCKET,
  validateAvatarUploadBuffer,
  type DetectedAvatarMime,
} from "@/lib/profile/avatar-upload";
import { isValidAvatarColor } from "@/lib/profile/avatar-colors";

type AppUserAvatarRow = {
  id: string;
  avatar_color: string | null;
  avatar_url: string | null;
  avatar_updated_at: string | null;
};

export type UpdatedAppUserAvatar = Pick<
  AppUser,
  "avatarColor" | "avatarUrl" | "avatarUpdatedAt"
>;

function toUpdatedAvatar(row: AppUserAvatarRow): UpdatedAppUserAvatar {
  return {
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
    avatarUpdatedAt: row.avatar_updated_at,
  };
}

async function removeAvatarObjects(userId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: objects, error: listError } = await supabase.storage
    .from(USER_AVATARS_BUCKET)
    .list(userId, { limit: 20 });

  if (listError || !objects?.length) return;

  const paths = objects.map((object) => `${userId}/${object.name}`);
  await supabase.storage.from(USER_AVATARS_BUCKET).remove(paths);
}

export async function updateAppUserAvatarColor(
  userId: string,
  avatarColor: string,
): Promise<UpdatedAppUserAvatar> {
  if (!isValidAvatarColor(avatarColor)) {
    throw new Error("Invalid avatar colour.");
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("app_users")
    .update({
      avatar_color: avatarColor,
      avatar_updated_at: now,
      updated_at: now,
    })
    .eq("id", userId)
    .select("id, avatar_color, avatar_url, avatar_updated_at")
    .single();

  if (error || !data) {
    throw new Error("Could not update avatar colour.");
  }

  return toUpdatedAvatar(data as AppUserAvatarRow);
}

export async function uploadAppUserAvatarImage(
  userId: string,
  buffer: Buffer,
  declaredMime?: string | null,
): Promise<UpdatedAppUserAvatar> {
  const mime: DetectedAvatarMime = validateAvatarUploadBuffer(
    buffer,
    declaredMime,
  );
  const storagePath = buildAvatarStoragePath(userId, mime);
  const supabase = createSupabaseServiceClient();

  await removeAvatarObjects(userId);

  const { error: uploadError } = await supabase.storage
    .from(USER_AVATARS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error("Could not upload avatar.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("app_users")
    .update({
      avatar_url: storagePath,
      avatar_updated_at: now,
      updated_at: now,
    })
    .eq("id", userId)
    .select("id, avatar_color, avatar_url, avatar_updated_at")
    .single();

  if (error || !data) {
    throw new Error("Could not save avatar.");
  }

  return toUpdatedAvatar(data as AppUserAvatarRow);
}
