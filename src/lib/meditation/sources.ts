export const meditationSource = {
  environmentVariable: "GOOGLE_SHEET_ID_MEDITATION",
  rangeStart: "A1:F",
  maxRows: 10_000,
  revalidateSeconds: 15 * 60,
} as const;

export function getMeditationSpreadsheetId(): string {
  const spreadsheetId = process.env[meditationSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${meditationSource.environmentVariable}.`);
  }
  return spreadsheetId;
}

export function getMeditationSourceTag(): string {
  return "meditation:sessions";
}

export function getMeditationRange(tabName: string, rowCount: number | null): string {
  const boundedRows = Math.max(1, Math.min(rowCount ?? 5_000, meditationSource.maxRows));
  return `'${tabName}'!${meditationSource.rangeStart}${boundedRows}`;
}
