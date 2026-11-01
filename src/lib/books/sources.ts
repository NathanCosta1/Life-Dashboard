export const booksSource = {
  environmentVariable: "GOOGLE_SHEET_ID_BOOKS",
  tab: "goodreads_library_export",
  maxRows: 1000,
  revalidateSeconds: 60 * 60,
} as const;

export function getBooksSpreadsheetId(): string {
  const spreadsheetId = process.env[booksSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${booksSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
