import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { financeSources, getSourceTag, getSpreadsheetId } from "./sources";
import { parseVacationTab } from "./vacations";
import type { VacationTrip, ValidationIssue } from "./types";

export type VacationData = { trips: VacationTrip[]; issues: ValidationIssue[] };

export async function loadVacationData(): Promise<VacationData> {
  const source = financeSources.vacationFinances;
  const spreadsheetId = getSpreadsheetId("vacationFinances");
  const tabs = await listSheetTabs(spreadsheetId);
  const selectedTabs = tabs.filter((tab) => tab.title.trim());
  const results = await Promise.all(selectedTabs.map(async (tab) => {
    const rows = await readSheetMatrix({
      spreadsheetId,
      range: `'${tab.title.replace(/'/g, "''")}'!A1:I100`,
      revalidate: source.revalidateSeconds,
      tags: [getSourceTag("vacationFinances")],
    });
    return parseVacationTab(rows, tab.title);
  }));
  return { trips: results.flatMap((result) => result.data), issues: results.flatMap((result) => result.issues) };
}
