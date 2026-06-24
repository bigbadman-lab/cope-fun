import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { createDraftMarket } from "@/lib/db/market-admin";

type CreateMarketRequest = {
  roomId?: unknown;
  title?: unknown;
  resolutionCriteria?: unknown;
  resolutionSource?: unknown;
  closesAt?: unknown;
  resolvesAt?: unknown;
};

export async function POST(request: Request) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as CreateMarketRequest;

    if (typeof body.roomId !== "string" || !body.roomId.trim()) {
      return NextResponse.json(
        { ok: false, error: "Room is required." },
        { status: 400 },
      );
    }

    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title is required." },
        { status: 400 },
      );
    }

    if (
      typeof body.resolutionCriteria !== "string" ||
      !body.resolutionCriteria.trim()
    ) {
      return NextResponse.json(
        { ok: false, error: "Resolution criteria are required." },
        { status: 400 },
      );
    }

    if (typeof body.closesAt !== "string" || !body.closesAt.trim()) {
      return NextResponse.json(
        { ok: false, error: "Close time is required." },
        { status: 400 },
      );
    }

    const market = await createDraftMarket({
      roomId: body.roomId.trim(),
      title: body.title,
      resolutionCriteria: body.resolutionCriteria,
      resolutionSource:
        typeof body.resolutionSource === "string" ? body.resolutionSource : null,
      closesAt: body.closesAt,
      resolvesAt:
        typeof body.resolvesAt === "string" && body.resolvesAt.trim()
          ? body.resolvesAt
          : null,
    });

    if (!market) {
      return NextResponse.json(
        { ok: false, error: "Room not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, market });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create market.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
