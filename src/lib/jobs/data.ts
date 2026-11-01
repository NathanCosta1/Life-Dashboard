import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseJobsLibrary } from "./parser";
import { getJobsSpreadsheetId, jobsSource } from "./sources";
import type { CareerLibrary } from "./types";

export async function loadCareerLibrary(): Promise<CareerLibrary> {
  const spreadsheetId = getJobsSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const tab = tabs.find((item) => item.title === jobsSource.tab);
  if (!tab) {
    throw new Error(`The configured Jobs sheet is missing the "${jobsSource.tab}" tab.`);
  }
  const rowLimit = Math.min(tab.rowCount ?? jobsSource.maxRows, jobsSource.maxRows);
  const rows = await readSheetMatrix({
    spreadsheetId,
    range: `'${jobsSource.tab}'!A1:I${rowLimit}`,
    revalidate: jobsSource.revalidateSeconds,
    tags: ["jobs", "jobs:career"],
  });
  return parseJobsLibrary(rows);
}
