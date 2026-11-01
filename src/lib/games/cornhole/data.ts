import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseCornholeLibrary } from "./parser";
import { cornholeSource, getCornholeSpreadsheetId } from "./sources";

export async function loadCornholeLibrary() {
  const spreadsheetId = getCornholeSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const standardTab = tabs.find((item) => item.title === cornholeSource.tabs.standard);
  const airmailTab = tabs.find((item) => item.title === cornholeSource.tabs.airmail);
  if (!standardTab) throw new Error(`The configured Cornhole sheet is missing the "${cornholeSource.tabs.standard}" tab.`);
  if (!airmailTab) throw new Error(`The configured Cornhole sheet is missing the "${cornholeSource.tabs.airmail}" tab.`);
  const standardRows = Math.min(standardTab.rowCount ?? cornholeSource.maxRows, cornholeSource.maxRows);
  const airmailRows = Math.min(airmailTab.rowCount ?? cornholeSource.maxRows, cornholeSource.maxRows);
  const standard = await readSheetMatrix({
    spreadsheetId,
    range: `'${cornholeSource.tabs.standard}'!A1:D${standardRows}`,
    revalidate: cornholeSource.revalidateSeconds,
    tags: ["games", "games:cornhole"],
  });
  const airmail = await readSheetMatrix({
    spreadsheetId,
    range: `'${cornholeSource.tabs.airmail}'!A1:D${airmailRows}`,
    revalidate: cornholeSource.revalidateSeconds,
    tags: ["games", "games:cornhole"],
  });
  return parseCornholeLibrary(standard, airmail);
}
