type CsvCell = string | number | boolean | null | undefined;

export function escapeCsvField(value: CsvCell): string {
  if (value === null || value === undefined) return "";

  const str =
    typeof value === "boolean"
      ? value
        ? "true"
        : "false"
      : String(value);

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function formatCsvRow(values: readonly CsvCell[]): string {
  return values.map(escapeCsvField).join(",");
}

export function formatCsvDocument(
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  const lines = [formatCsvRow(headers), ...rows.map((row) => formatCsvRow(row))];
  return `${lines.join("\n")}\n`;
}
