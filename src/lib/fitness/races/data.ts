import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseRaceLibrary } from "./parser";
import { getRacesSpreadsheetId, racesSource } from "./sources";

export async function loadRaceLibrary() {
  const spreadsheetId = getRacesSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const tab = tabs.find((item) => item.title.trim() === racesSource.tab);
  if (!tab) throw new Error(`The configured Races sheet is missing the "${racesSource.tab}" tab.`);
  const rowLimit = Math.min(tab.rowCount ?? racesSource.maxRows, racesSource.maxRows);
  const rows = await readSheetMatrix({
    spreadsheetId,
    range: `'${tab.title}'!A1:U${rowLimit}`,
    revalidate: racesSource.revalidateSeconds,
    tags: ["fitness", "fitness:races"],
  });
  return parseRaceLibrary(rows);
}
