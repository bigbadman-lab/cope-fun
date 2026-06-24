import { searchBeliefRooms } from "@/lib/db/room-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    const results = await searchBeliefRooms(query);

    return Response.json({ ok: true, results });
  } catch {
    return Response.json(
      { ok: false, error: "Could not search beliefs." },
      { status: 500 },
    );
  }
}
