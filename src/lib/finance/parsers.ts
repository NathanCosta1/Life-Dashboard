export function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

export function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseCurrency(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const negative = /^\(.*\)$/.test(normalized);
  const numeric = normalized.replace(/[$,%\s,()]/g, "");
  if (!numeric || !/^-?\d+(\.\d+)?$/.test(numeric)) {
    return null;
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : null;
}

export function parsePercentage(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const hasPercentSign = normalized.endsWith("%");
  const parsed = parseCurrency(normalized.replace(/%$/, ""));
  if (parsed === null) {
    return null;
  }

  return hasPercentSign ? parsed / 100 : parsed;
}

export function parseYear(value: string): number | null {
  const match = value.trim().match(/^(19|20)\d{2}$/);
  return match ? Number(value) : null;
}

export function parseMonth(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const index = monthNames.findIndex(
    (month) => month === normalized || month.slice(0, 3) === normalized,
  );
  return index === -1 ? null : index + 1;
}

export function parseDate(value: string): Date | null {
  const parsed = new Date(value.trim());
  return value.trim() && !Number.isNaN(parsed.valueOf()) ? parsed : null;
}

export function findHeaderIndex(
  row: readonly string[],
  predicate: (normalizedCell: string) => boolean,
): number {
  return row.findIndex((cell) => predicate(normalizeLabel(cell)));
}
