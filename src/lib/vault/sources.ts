export const vaultSource = {
  environmentVariable: "GOOGLE_SHEET_ID_SECRET_SHEET",
  tabs: ["2024", "2025", "2026"] as const,
  maxRows: 1_099,
  revalidateSeconds: 60 * 60,
};

export function getVaultSpreadsheetId(): string {
  const spreadsheetId = process.env[vaultSource.environmentVariable];
  if (!spreadsheetId?.trim()) throw new Error(`Missing ${vaultSource.environmentVariable}.`);
  return spreadsheetId;
}
