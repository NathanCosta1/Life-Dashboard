import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseBasketballLibrary } from "./parser";
import { basketballSource, getBasketballSpreadsheetId } from "./sources";

export async function loadBasketballLibrary() {
  const spreadsheetId = getBasketballSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const values: Record<string, readonly (readonly string[])[]> = {};
  for (const [key, title] of Object.entries(basketballSource.tabs)) {
    const tab = tabs.find((item) => item.title === title);
    if (!tab) throw new Error(`The configured Basketball sheet is missing the "${title}" tab.`);
    const rowLimit = Math.min(tab.rowCount ?? basketballSource.maxRows, basketballSource.maxRows);
    values[key] = await readSheetMatrix({
      spreadsheetId,
      range: `'${title}'!A1:D${rowLimit}`,
      revalidate: basketballSource.revalidateSeconds,
      tags: ["fitness", "fitness:basketball"],
    });
  }
  return parseBasketballLibrary(values.freeThrows, values.threePointers);
}
