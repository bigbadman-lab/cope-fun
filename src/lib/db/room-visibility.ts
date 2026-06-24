import "server-only";

/** Published rooms visible on public discovery surfaces. */
export const PUBLIC_ROOM_LISTING_FILTERS = {
  status: "published" as const,
  is_hidden: false,
};
