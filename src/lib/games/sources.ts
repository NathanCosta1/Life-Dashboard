export const gamesSource = {
  environmentVariable: "GOOGLE_SHEET_ID_GAMES",
  tabs: {
    digital: "Digital",
    watchlist: "Watchlist",
    analog: "Analog",
    completed: "Completed",
    disliked: "Disliked",
  },
  maxRows: 1000,
  revalidateSeconds: 60 * 60,
} as const;

export function getGamesSpreadsheetId(): string {
  const spreadsheetId = process.env[gamesSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${gamesSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
