export const screenTimeSource = {
  environmentVariable: "GOOGLE_SHEET_ID_SCREEN_TIME",
  tabs: ["Nathan", "Maddy"] as const,
  maxRows: 1001,
  revalidateSeconds: 60 * 60,
} as const;

export function getScreenTimeSpreadsheetId(): string {
  const spreadsheetId = process.env[screenTimeSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${screenTimeSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
