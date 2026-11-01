export const moviesSource = {
  environmentVariable: "GOOGLE_SHEET_ID_MOVIES",
  tabs: ["Reviews / Notes", "To Watch"] as const,
  maxRows: 2500,
  revalidateSeconds: 60 * 60,
} as const;

export function getMoviesSpreadsheetId(): string {
  const spreadsheetId = process.env[moviesSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${moviesSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
