export const basketballSource = {
  environmentVariable: "GOOGLE_SHEET_ID_BASKETBALL",
  tabs: { freeThrows: "Free Throws", threePointers: "Three Pointers" },
  maxRows: 1054,
  revalidateSeconds: 60 * 60,
} as const;

export function getBasketballSpreadsheetId(): string {
  const spreadsheetId = process.env[basketballSource.environmentVariable];
  if (!spreadsheetId?.trim()) throw new Error(`Missing ${basketballSource.environmentVariable}.`);
  return spreadsheetId;
}
