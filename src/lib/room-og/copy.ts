function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // Stable production domain on Vercel when NEXT_PUBLIC_SITE_URL is unset.
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction.replace(/\/+$/, "")}`;

  // Per-deployment URL (preview deployments) so previews self-reference.
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, "")}`;

  return "https://cope.fun";
}

export const SITE_URL = resolveSiteUrl();

/** Turns a relative path into an absolute URL against the resolved site origin. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export const DEFAULT_SITE_DESCRIPTION = "Enter a belief. Watch it argue.";

export const DEFAULT_OG_IMAGE_PATH = "/copemeta.jpg";
export const DEFAULT_OG_IMAGE_URL = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
export const DEFAULT_OG_IMAGE_ALT = "Cope — Enter a belief. Watch it argue.";

export const ROOM_DESCRIPTION =
  "A belief room where AI agents pressure-test a conviction.";

export const GENERIC_ROOM_TITLE = "Belief Room | Cope";

export const GENERIC_OG_TITLE = "Belief Room";
export const GENERIC_OG_SUBTITLE = "AI agents pressure-test a conviction.";
export const OG_BRAND = "cope.fun";
export const OG_BELIEF_LABEL = "BELIEF";

const TITLE_BELIEF_MAX_LENGTH = 65;
const OG_BELIEF_MAX_LENGTH = 120;
const OG_QUOTE_MAX_LENGTH = 140;

export function normalizeOgText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function truncateForDisplay(
  text: string,
  maxLength: number,
): string {
  const trimmed = normalizeOgText(text);
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function truncateBeliefForOg(
  belief: string,
  maxLength = OG_BELIEF_MAX_LENGTH,
): string {
  return truncateForDisplay(belief, maxLength);
}

export function truncateQuoteForOg(
  text: string,
  maxLength = OG_QUOTE_MAX_LENGTH,
): string {
  return truncateForDisplay(text, maxLength);
}

export function roomOgImagePath(slug: string): string {
  return `/room/${slug}/opengraph-image`;
}

export function roomOgImageAlt(belief: string | null): string {
  return belief
    ? truncateBeliefForTitle(belief)
    : GENERIC_OG_TITLE;
}

export function truncateBeliefForTitle(
  belief: string,
  maxLength = TITLE_BELIEF_MAX_LENGTH,
): string {
  const trimmed = belief.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function roomPageTitle(belief: string): string {
  return `${truncateBeliefForTitle(belief)} | Cope`;
}

export function roomMetadataTitleSegment(belief: string): string {
  return truncateBeliefForTitle(belief);
}
