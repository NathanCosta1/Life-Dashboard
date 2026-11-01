export const racesSource = {
  environmentVariable: "GOOGLE_SHEET_ID_RACES",
  tab: "Races",
  maxRows: 1000,
  revalidateSeconds: 60 * 60,
} as const;

export function getRacesSpreadsheetId(): string {
  const spreadsheetId = process.env[racesSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${racesSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
