const MAX_LIBRARY_ROWS = 10_000;

export const musicSource = {
  environmentVariable: "GOOGLE_SHEET_ID_MUSIC",
  libraryTab: "My Apple Music Library",
  libraryRangeStart: "A1:I",
  maxRows: MAX_LIBRARY_ROWS,
  revalidateSeconds: 60 * 60,
  albumPlaylistName: "Albums: To Listen",
} as const;

export function getMusicSpreadsheetId(): string {
  const spreadsheetId = process.env[musicSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${musicSource.environmentVariable}.`);
  }
  return spreadsheetId;
}

export function getMusicSourceTag(): string {
  return "music:library";
}

export function getMusicLibraryRange(rowCount: number | null): string {
  const boundedRows = Math.max(1, Math.min(rowCount ?? 5_000, musicSource.maxRows));
  return `'${musicSource.libraryTab}'!${musicSource.libraryRangeStart}${boundedRows}`;
}
