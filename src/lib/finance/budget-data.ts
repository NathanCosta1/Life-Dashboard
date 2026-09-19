import { readSheetMatrix } from "@/lib/sheets";
import { financeSources, getSourceTag, getSpreadsheetId } from "./sources";
import { parseBudgetTab } from "./budget";
import type { BudgetData } from "./types";

export async function loadBudgetData(): Promise<BudgetData> {
  const source = financeSources.budget;
  try {
    const rows = await readSheetMatrix({ spreadsheetId: getSpreadsheetId("budget"), range: source.ranges.planned, revalidate: source.revalidateSeconds, tags: [getSourceTag("budget")] });
    const parsed = parseBudgetTab(rows, "Planned");
    return { lines: parsed.data, issues: parsed.issues, source: { tab: "Planned", frequency: parsed.data[0]?.frequency ?? "unknown" } };
  } catch (error) {
    return { lines: [], issues: [{ source: "budget", tab: "Planned", rowNumber: 1, message: error instanceof Error ? error.message : "Budget source could not be loaded." }], source: { tab: "Planned", frequency: "unknown" } };
  }
}
