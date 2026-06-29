import { NextResponse } from "next/server";
import type { AdminRoomAction } from "@/lib/admin/dashboard-types";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { applyAdminRoomAction } from "@/lib/db/admin-rooms";

type RoomActionRequest = {
  action?: unknown;
};

const ADMIN_ROOM_ACTIONS = new Set<AdminRoomAction>([
  "hide",
  "unhide",
  "feature",
  "unfeature",
  "mark_market_candidate",
  "remove_market_candidate",
  "delete",
]);

function isAdminRoomAction(value: unknown): value is AdminRoomAction {
  return typeof value === "string" && ADMIN_ROOM_ACTIONS.has(value as AdminRoomAction);
}

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { roomId } = await context.params;
    const body = (await request.json()) as RoomActionRequest;

    if (!isAdminRoomAction(body.action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid room action." },
        { status: 400 },
      );
    }

    const room = await applyAdminRoomAction(roomId, body.action);
    if (!room) {
      return NextResponse.json(
        { ok: false, error: "Room not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, room });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Could not update room." },
      { status: 500 },
    );
  }
}
