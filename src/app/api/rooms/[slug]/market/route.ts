import { NextResponse } from "next/server";
import { tryGetAppUserFromRequest } from "@/lib/auth/app-user";
import { resolveAnonymousSessionIdFromToken } from "@/lib/db/analytics";
import { getRoomMarketBySlug } from "@/lib/db/markets";

function getAnonymousToken(request: Request): string {
  const { searchParams } = new URL(request.url);
  return (searchParams.get("anonymousToken") ?? "").trim();
}

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const appUser = await tryGetAppUserFromRequest(request);
    const anonymousToken = getAnonymousToken(request);
    const sessionId = anonymousToken
      ? await resolveAnonymousSessionIdFromToken(anonymousToken)
      : null;

    const market = await getRoomMarketBySlug(slug, {
      userId: appUser?.id ?? null,
      anonymousSessionId: appUser ? null : sessionId,
    });

    if (!market) {
      return NextResponse.json({ ok: true, market: null });
    }

    return NextResponse.json({ ok: true, market });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not load market." },
      { status: 500 },
    );
  }
}
