export function parseTreasuryConvictionCope(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      throw new Error(
        "Treasury Conviction must be a non-negative whole number.",
      );
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    if (!/^\d+$/.test(trimmed)) {
      throw new Error(
        "Treasury Conviction must be a non-negative whole number.",
      );
    }

    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(
        "Treasury Conviction must be a non-negative whole number.",
      );
    }

    return parsed;
  }

  throw new Error("Treasury Conviction must be a non-negative whole number.");
}

export function toTreasuryConvictionCope(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined) return 0;

  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  return Math.trunc(parsed);
}
