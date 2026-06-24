import { searchBeliefRooms } from "@/lib/db/room-search";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/db/analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    const results = await searchBeliefRooms(query);

    if (query.length > 0) {
      trackEvent({
        eventName: ANALYTICS_EVENTS.searchPerformed,
        metadata: { queryLength: query.length },
      });
    }

    return Response.json({ ok: true, results });
  } catch {
    return Response.json(
      { ok: false, error: "Could not search beliefs." },
      { status: 500 },
    );
  }
}
