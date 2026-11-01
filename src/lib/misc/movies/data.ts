import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseMoviesLibrary } from "./parser";
import { getMoviesSpreadsheetId, moviesSource } from "./sources";

export async function loadMoviesLibrary() {
  const spreadsheetId = getMoviesSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const values: Record<string, readonly (readonly string[])[]> = {};
  for (const tabName of moviesSource.tabs) {
    const tab = tabs.find((item) => item.title === tabName);
    if (!tab) throw new Error(`The configured Movies sheet is missing the "${tabName}" tab.`);
    const rowLimit = Math.min(tab.rowCount ?? moviesSource.maxRows, moviesSource.maxRows);
    values[tabName] = await readSheetMatrix({
      spreadsheetId,
      range: `'${tabName.replaceAll("'", "''")}'!A1:F${rowLimit}`,
      revalidate: moviesSource.revalidateSeconds,
      tags: ["misc", "misc:movies"],
    });
  }
  return parseMoviesLibrary(values["Reviews / Notes"] ?? [], values["To Watch"] ?? []);
}
