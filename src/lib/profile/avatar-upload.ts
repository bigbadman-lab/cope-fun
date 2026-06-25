import "server-only";
import { getAvatarPublicUrl } from "@/lib/profile/avatar-colors";

export const USER_AVATARS_BUCKET = "user-avatars";
export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type DetectedAvatarMime = "image/jpeg" | "image/png" | "image/webp";

export function detectAvatarMime(buffer: Buffer): DetectedAvatarMime | null {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function extensionForAvatarMime(mime: DetectedAvatarMime): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function validateAvatarUploadBuffer(
  buffer: Buffer,
  declaredMime?: string | null,
): DetectedAvatarMime {
  if (buffer.length === 0) {
    throw new Error("Choose an image to upload.");
  }

  if (buffer.length > MAX_AVATAR_UPLOAD_BYTES) {
    throw new Error("Image is too large. Choose a file under 2MB.");
  }

  const detected = detectAvatarMime(buffer);
  if (!detected) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }

  if (declaredMime && !ALLOWED_MIME_TYPES.has(declaredMime)) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }

  if (declaredMime && declaredMime !== detected) {
    throw new Error("Image type does not match file contents.");
  }

  return detected;
}

export function buildAvatarStoragePath(
  userId: string,
  mime: DetectedAvatarMime,
): string {
  return `${userId}/avatar.${extensionForAvatarMime(mime)}`;
}

export function resolveAvatarPublicUrl(avatarPath: string | null): string | null {
  return getAvatarPublicUrl(avatarPath);
}
