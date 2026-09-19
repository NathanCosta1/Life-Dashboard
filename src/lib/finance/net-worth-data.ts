import { readSheetMatrix } from "@/lib/sheets";
import { financeSources, getSourceTag, getSpreadsheetId } from "./sources";
import { parseAnnualMetric, parseNetWorthPoints } from "./net-worth";
import type { AnnualMetricPoint, NetWorthPoint, ValidationIssue } from "./types";

export type NetWorthData = {
  netWorth: NetWorthPoint[];
  income: AnnualMetricPoint[];
  expenses: AnnualMetricPoint[];
  issues: ValidationIssue[];
};

export async function loadNetWorthData(): Promise<NetWorthData> {
  const source = financeSources.netWorth;
  const spreadsheetId = getSpreadsheetId("netWorth");
  const results = await Promise.allSettled([
    readSheetMatrix({ spreadsheetId, range: source.ranges.netWorth, revalidate: source.revalidateSeconds, tags: [getSourceTag("netWorth")] }),
    readSheetMatrix({ spreadsheetId, range: source.ranges.income, revalidate: source.revalidateSeconds, tags: [getSourceTag("netWorth")] }),
    readSheetMatrix({ spreadsheetId, range: source.ranges.expenses, revalidate: source.revalidateSeconds, tags: [getSourceTag("netWorth")] }),
  ]);
  const [netWorthResult, incomeResult, expensesResult] = results;
  const issueFor = (field: string, result: PromiseSettledResult<unknown>) => result.status === "rejected"
    ? [{ source: "netWorth" as const, tab: field === "netWorth" ? "Net Worth" : field[0].toUpperCase() + field.slice(1), rowNumber: 1, field, message: "This source block could not be loaded." }]
    : [];
  const netWorthRows = netWorthResult.status === "fulfilled" ? netWorthResult.value : [];
  const incomeRows = incomeResult.status === "fulfilled" ? incomeResult.value : [];
  const expensesRows = expensesResult.status === "fulfilled" ? expensesResult.value : [];
  const netWorth = parseNetWorthPoints(netWorthRows, "Net Worth");
  const income = parseAnnualMetric(incomeRows, "income", "Income");
  const expenses = parseAnnualMetric(expensesRows, "expenses", "Expenses");
  return {
    netWorth: netWorth.data,
    income: income.data,
    expenses: expenses.data,
    issues: [...netWorth.issues, ...income.issues, ...expenses.issues, ...issueFor("netWorth", netWorthResult), ...issueFor("income", incomeResult), ...issueFor("expenses", expensesResult)],
  };
}
