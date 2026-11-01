export const cornholeSource = {
  environmentVariable: "GOOGLE_SHEET_ID_CORNHOLE",
  tabs: { standard: "Cornhole Makes", airmail: "Airmail Makes" },
  maxRows: 1018,
  revalidateSeconds: 60 * 60,
} as const;

export function getCornholeSpreadsheetId(): string {
  const spreadsheetId = process.env[cornholeSource.environmentVariable];
  if (!spreadsheetId?.trim()) throw new Error(`Missing ${cornholeSource.environmentVariable}.`);
  return spreadsheetId;
}
