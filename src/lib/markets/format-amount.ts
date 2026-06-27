/** Readable whole-number formatting for token/credit display (e.g. 2500000 → 2,500,000). */
export function formatWholeAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.trunc(value).toLocaleString("en-US");
}
