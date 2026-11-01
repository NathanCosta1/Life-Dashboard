import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseGoiExperiment } from "./parser";
import { getGoiExperimentSpreadsheetId, goiExperimentSource } from "./sources";
import type { GoiExperimentLibrary } from "./types";

export async function loadGoiExperiment(): Promise<GoiExperimentLibrary> {
  const spreadsheetId = getGoiExperimentSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const tab = tabs.find((item) => item.title === goiExperimentSource.tab);
  if (!tab) throw new Error(`The configured GOI sheet is missing the "${goiExperimentSource.tab}" tab.`);
  const rowLimit = Math.min(tab.rowCount ?? goiExperimentSource.maxRows, goiExperimentSource.maxRows);
  const rows = await readSheetMatrix({
    spreadsheetId,
    range: `'${goiExperimentSource.tab}'!A1:F${rowLimit}`,
    revalidate: goiExperimentSource.revalidateSeconds,
    tags: ["games", "games:random", "games:random:goi-experiment"],
  });
  return parseGoiExperiment(rows);
}
