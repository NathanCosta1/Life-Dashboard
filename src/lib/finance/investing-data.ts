import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseInvestmentTab } from "./investing";
import { financeSources, getSourceTag, getSpreadsheetId } from "./sources";
import type { InvestmentMonth, ParseResult, ValidationIssue } from "./types";

export type InvestmentSourceTab = {
  title: string;
  rowCount: number | null;
  columnCount: number | null;
  status: "available" | "empty";
};

export type InvestmentData = {
  months: InvestmentMonth[];
  tabs: InvestmentSourceTab[];
  issues: ValidationIssue[];
};

export async function loadInvestmentData(): Promise<InvestmentData> {
  const source = financeSources.investing;
  const spreadsheetId = getSpreadsheetId("investing");
  const tabs = await listSheetTabs(spreadsheetId);
  const yearTabs = tabs.filter((tab) => /^\d{4}$/.test(tab.title));
  const results = await Promise.all(
    yearTabs.map(async (tab): Promise<ParseResult<InvestmentMonth>> => {
      const values = await readSheetMatrix({
        spreadsheetId,
        range: `'${tab.title.replaceAll("'", "''")}'!${source.ranges.yearlyTabs}`,
        revalidate: source.revalidateSeconds,
        tags: [getSourceTag("investing"), `finance:investing:${tab.title}`],
      });
      if (values.length === 0 || values.every((row) => row.every((cell) => !cell.trim()))) {
        return { data: [], issues: [] };
      }
      return parseInvestmentTab(values, tab.title);
    }),
  );

  return {
    months: results.flatMap((result) => result.data),
    tabs: yearTabs.map((tab, index) => ({
      ...tab,
      status: results[index].data.length > 0 ? "available" : "empty",
    })),
    issues: results.flatMap((result) => result.issues),
  };
}
