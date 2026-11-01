import "server-only";
import { listSheetTabs, readSheetBackgroundColors, readSheetMatrix } from "@/lib/sheets";
import { parseGamesLibrary } from "./parser";
import { gamesSource, getGamesSpreadsheetId } from "./sources";
import type { GamesLibrary } from "./types";

export async function loadGamesLibrary(): Promise<GamesLibrary> {
  const spreadsheetId = getGamesSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const entries = {} as Record<keyof typeof gamesSource.tabs, readonly (readonly string[])[]>;
  let digitalOwnerColors: Record<number, string | null> = {};

  for (const [key, title] of Object.entries(gamesSource.tabs) as [keyof typeof gamesSource.tabs, string][] ) {
    const tab = tabs.find((item) => item.title === title);
    if (!tab) {
      throw new Error(`The configured Games sheet is missing the "${title}" tab.`);
    }
    const rowLimit = Math.min(tab.rowCount ?? 1000, gamesSource.maxRows);
    const column = key === "digital" ? "G" : key === "watchlist" ? "G" : key === "completed" ? "D" : "B";
    entries[key] = await readSheetMatrix({
      spreadsheetId,
      range: `'${title}'!A1:${column}${rowLimit}`,
      revalidate: gamesSource.revalidateSeconds,
      tags: ["games", `games:${key}`],
    });
    if (key === "digital") {
      digitalOwnerColors = await readSheetBackgroundColors({
        spreadsheetId,
        range: `'${title}'!D1:D${rowLimit}`,
        revalidate: gamesSource.revalidateSeconds,
        tags: ["games", "games:digital-colors"],
      });
    }
  }

  return parseGamesLibrary(entries, digitalOwnerColors);
}
