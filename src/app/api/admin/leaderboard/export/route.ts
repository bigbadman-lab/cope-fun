import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { formatCsvDocument } from "@/lib/csv/format-csv";
import {
  getLeaderboardExportRows,
  LEADERBOARD_EXPORT_CSV_HEADERS,
  leaderboardExportRowToCsvCells,
} from "@/lib/db/admin-leaderboard-export";
import { getSeasonExportId } from "@/lib/seasons";

function formatExportFilename(seasonSlug: string, generatedAt: string): string {
  const date = generatedAt.slice(0, 10);
  return `cope-${seasonSlug}-leaderboard-export-${date}.csv`;
}

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId");

  try {
    const exportGeneratedAt = new Date().toISOString();
    const { season, rows } = await getLeaderboardExportRows({
      seasonId,
      exportGeneratedAt,
    });

    const csv = formatCsvDocument(
      LEADERBOARD_EXPORT_CSV_HEADERS,
      rows.map((row) => leaderboardExportRowToCsvCells(row)),
    );

    const seasonSlug = getSeasonExportId(season);
    const filename = formatExportFilename(seasonSlug, exportGeneratedAt);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Could not generate leaderboard export.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
