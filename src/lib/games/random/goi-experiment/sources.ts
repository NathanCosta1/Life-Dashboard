export const goiExperimentSource = {
  environmentVariable: "GOOGLE_SHEET_ID_GAMES_GOI",
  tab: "Sheet1",
  maxRows: 500,
  revalidateSeconds: 60 * 60,
} as const;

export function getGoiExperimentSpreadsheetId(): string {
  const spreadsheetId = process.env[goiExperimentSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${goiExperimentSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
