import { readSheetMatrix } from "@/lib/sheets";
import { financeSources, getSourceTag, getSpreadsheetId } from "./sources";
import { parseHousingWorkbook } from "./housing";
import type { HousingWorkbook } from "./housing";
import type { ValidationIssue } from "./types";

export type HousingData = { workbook: HousingWorkbook; issues: ValidationIssue[] };

export async function loadHousingData(): Promise<HousingData> {
  const source = financeSources.housing;
  const rows = await readSheetMatrix({
    spreadsheetId: getSpreadsheetId("housing"),
    range: source.ranges.apartment,
    revalidate: source.revalidateSeconds,
    tags: [getSourceTag("housing")],
  });
  const result = parseHousingWorkbook(rows);
  return { workbook: result.data[0] ?? { moveIn: [], items: [], monthly: [] }, issues: result.issues };
}
