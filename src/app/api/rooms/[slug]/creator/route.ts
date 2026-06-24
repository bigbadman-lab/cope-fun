import { getRoomCreatorStatus } from "@/lib/db/room-auth";

type CreatorRequest = {
  anonymousToken?: unknown;
};

function getAnonymousToken(request: Request, body?: CreatorRequest): string {
  if (body && typeof body.anonymousToken === "string") {
    return body.anonymousToken.trim();
  }

  const { searchParams } = new URL(request.url);
  return (searchParams.get("anonymousToken") ?? "").trim();
}

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const anonymousToken = getAnonymousToken(request);

    if (!anonymousToken) {
      return Response.json(
        { ok: false, error: "Anonymous session token is required." },
        { status: 400 },
      );
    }

    const status = await getRoomCreatorStatus(slug, anonymousToken);
    return Response.json({ ok: true, ...status });
  } catch {
    return Response.json(
      { ok: false, error: "Could not verify room creator." },
      { status: 500 },
    );
  }
}
