import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseScreenTimeLibrary } from "./parser";
import { getScreenTimeSpreadsheetId, screenTimeSource } from "./sources";

export async function loadScreenTimeLibrary() {
  const spreadsheetId = getScreenTimeSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const values: Record<string, readonly (readonly string[])[]> = {};

  for (const owner of screenTimeSource.tabs) {
    const tab = tabs.find((item) => item.title === owner);
    if (!tab) {
      throw new Error(`The configured Screen Time sheet is missing the "${owner}" tab.`);
    }
    const rowLimit = Math.min(tab.rowCount ?? screenTimeSource.maxRows, screenTimeSource.maxRows);
    values[owner] = await readSheetMatrix({
      spreadsheetId,
      range: `'${owner}'!A1:I${rowLimit}`,
      revalidate: screenTimeSource.revalidateSeconds,
      tags: ["misc", "misc:screen-time"],
    });
  }

  return parseScreenTimeLibrary(values.Nathan, values.Maddy);
}
