import { getRecentPublishedBeliefs } from "@/lib/db/room-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") ?? 3);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 3;
    const results = await getRecentPublishedBeliefs(limit);

    return Response.json({ ok: true, results });
  } catch {
    return Response.json(
      { ok: false, error: "Could not load recent beliefs." },
      { status: 500 },
    );
  }
}
