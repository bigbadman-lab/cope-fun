import { NextResponse } from "next/server";
import {
  isUnauthorizedError,
  requireAppUser,
  unauthorizedResponse,
} from "@/lib/auth/require-app-user";
import {
  removeAppUserAvatarPhoto,
  updateAppUserAvatarColor,
  uploadAppUserAvatarImage,
} from "@/lib/db/user-avatar";
import { resolveAvatarPublicUrl } from "@/lib/profile/avatar-upload";

function avatarResponse(updated: {
  avatarColor: string | null;
  avatarUrl: string | null;
  avatarUpdatedAt: string | null;
}) {
  return {
    avatarColor: updated.avatarColor,
    avatarUrl: updated.avatarUrl,
    avatarPublicUrl: resolveAvatarPublicUrl(updated.avatarUrl),
    avatarUpdatedAt: updated.avatarUpdatedAt,
  };
}

export async function PATCH(request: Request) {
  try {
    const appUser = await requireAppUser(request);
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileValue = formData.get("file");

      if (!(fileValue instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "Choose an image to upload." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await fileValue.arrayBuffer());
      const updated = await uploadAppUserAvatarImage(
        appUser.id,
        buffer,
        fileValue.type,
      );

      return NextResponse.json({
        ok: true,
        avatar: avatarResponse(updated),
      });
    }

    const body = (await request.json()) as {
      avatar_color?: unknown;
      removePhoto?: unknown;
    };

    if (body.removePhoto === true) {
      const updated = await removeAppUserAvatarPhoto(appUser.id);

      return NextResponse.json({
        ok: true,
        avatar: avatarResponse(updated),
      });
    }

    const avatarColor =
      typeof body.avatar_color === "string" ? body.avatar_color.trim() : "";

    if (!avatarColor) {
      return NextResponse.json(
        { ok: false, error: "Choose an avatar colour." },
        { status: 400 },
      );
    }

    const updated = await updateAppUserAvatarColor(appUser.id, avatarColor);

    return NextResponse.json({
      ok: true,
      avatar: avatarResponse(updated),
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse(error.message);
    }

    const message =
      error instanceof Error ? error.message : "Could not update avatar.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
