import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/require-auth";
import { updateMarketAdminFields } from "@/lib/db/market-admin";

type UpdateMarketRequest = {
  title?: unknown;
  resolutionCriteria?: unknown;
  resolutionSource?: unknown;
  closesAt?: unknown;
  resolvesAt?: unknown;
  treasuryConvictionCope?: unknown;
  seasonId?: unknown;
  displayOrder?: unknown;
  isFeatured?: unknown;
};

type RouteContext = {
  params: Promise<{ marketId: string }>;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { marketId } = await context.params;
    const body = (await request.json()) as UpdateMarketRequest;

    const input: Parameters<typeof updateMarketAdminFields>[0] = {
      marketId,
    };

    if (body.title !== undefined) {
      if (typeof body.title !== "string") {
        return NextResponse.json(
          { ok: false, error: "Title must be a string." },
          { status: 400 },
        );
      }
      input.title = body.title;
    }

    if (body.resolutionCriteria !== undefined) {
      if (typeof body.resolutionCriteria !== "string") {
        return NextResponse.json(
          { ok: false, error: "Resolution criteria must be a string." },
          { status: 400 },
        );
      }
      input.resolutionCriteria = body.resolutionCriteria;
    }

    if (body.resolutionSource !== undefined) {
      input.resolutionSource =
        body.resolutionSource === null
          ? null
          : optionalString(body.resolutionSource) ?? null;
    }

    if (body.closesAt !== undefined) {
      const closesAt = optionalString(body.closesAt);
      if (!closesAt) {
        return NextResponse.json(
          { ok: false, error: "Close time must be a valid datetime string." },
          { status: 400 },
        );
      }
      input.closesAt = closesAt;
    }

    if (body.resolvesAt !== undefined) {
      if (body.resolvesAt === null || body.resolvesAt === "") {
        input.resolvesAt = null;
      } else {
        const resolvesAt = optionalString(body.resolvesAt);
        if (!resolvesAt) {
          return NextResponse.json(
            { ok: false, error: "Resolve time must be a valid datetime string." },
            { status: 400 },
          );
        }
        input.resolvesAt = resolvesAt;
      }
    }

    if (body.treasuryConvictionCope !== undefined) {
      if (
        typeof body.treasuryConvictionCope !== "number" ||
        !Number.isInteger(body.treasuryConvictionCope)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Treasury Conviction must be a whole number.",
          },
          { status: 400 },
        );
      }
      input.treasuryConvictionCope = body.treasuryConvictionCope;
    }

    if (body.seasonId !== undefined) {
      if (typeof body.seasonId !== "string") {
        return NextResponse.json(
          { ok: false, error: "Season ID must be a string." },
          { status: 400 },
        );
      }
      input.seasonId = body.seasonId;
    }

    if (body.displayOrder !== undefined) {
      input.displayOrder = body.displayOrder as number | null;
    }

    if (body.isFeatured !== undefined) {
      if (typeof body.isFeatured !== "boolean") {
        return NextResponse.json(
          { ok: false, error: "Featured must be true or false." },
          { status: 400 },
        );
      }
      input.isFeatured = body.isFeatured;
    }

    const market = await updateMarketAdminFields(input);

    if (!market) {
      return NextResponse.json(
        { ok: false, error: "Market not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, market });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update market.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
