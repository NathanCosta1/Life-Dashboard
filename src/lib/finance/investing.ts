import type { InvestmentMonth, ParseResult } from "./types";
import { isBlankRow, normalizeLabel, parseCurrency, parseMonth, parseYear } from "./parsers";

export function parseInvestmentTab(
  rows: readonly (readonly string[])[],
  tab: string,
): ParseResult<InvestmentMonth> {
  const data: InvestmentMonth[] = [];
  const issues = [];
  const headerIndex = rows.findIndex((row) => normalizeLabel(row[0] ?? "") === "month");
  if (headerIndex === -1) {
    return { data, issues: [{ source: "investing", tab, rowNumber: 1, field: "headers", message: "Month header was not found." }] };
  }

  const header = rows[headerIndex];
  const detailHeader = rows[headerIndex + 1] ?? [];
  const totalIndex = header.findIndex((cell) => normalizeLabel(cell) === "total");
  let currentAccount = "";
  const accountColumns = header.flatMap((cell, index) => {
    if (cell.trim()) {
      currentAccount = cell.trim();
    }
    const name = currentAccount;
    const detail = normalizeLabel(detailHeader[index] ?? "");
    if (
      index === 0 ||
      !name ||
      normalizeLabel(name) === "notes" ||
      normalizeLabel(name) === "total" ||
      (detail !== "monthly contributions" && detail !== "match" && detail !== "starting contributions")
    ) {
      return [];
    }
    return [{ name: detail === "match" ? `${name} Match` : name, index, detail }];
  });
  const year = parseYear(tab);
  if (year === null) {
    return { data, issues: [{ source: "investing", tab, rowNumber: headerIndex + 1, field: "tab", message: "Tab name is not a four-digit year.", value: tab }] };
  }

  for (let index = headerIndex + (detailHeader.length > 0 ? 2 : 1); index < rows.length; index += 1) {
    const row = rows[index];
    if (isBlankRow(row)) continue;
    const month = parseMonth(row[0] ?? "");
    if (month === null) continue;
    const location = { source: "investing" as const, tab, rowNumber: index + 1 };
    const accounts = [];
    const startingBalances = [];
    for (const column of accountColumns) {
      const raw = row[column.index] ?? "";
      if (!raw.trim()) continue;
      const amount = parseCurrency(raw);
      if (amount === null) {
        issues.push({ ...location, field: column.name, message: "Invalid investment amount.", value: raw });
        continue;
      }
      const accountValue = { account: column.name, amount, columnIndex: column.index };
      if (column.detail === "starting contributions") {
        startingBalances.push(accountValue);
      } else {
        accounts.push(accountValue);
      }
    }
    const calculatedTotal = accounts.reduce((sum, account) => sum + account.amount, 0);
    const providedTotal = totalIndex === -1 ? null : parseCurrency(row[totalIndex] ?? "");
    if (totalIndex !== -1 && row[totalIndex]?.trim() && providedTotal === null) {
      issues.push({ ...location, field: "Total", message: "Invalid total amount.", value: row[totalIndex] });
    }
    data.push({
      period: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
      accounts,
      startingBalances,
      providedTotal,
      calculatedTotal,
      total: providedTotal ?? calculatedTotal,
      totalMatchesAccounts: providedTotal === null ? null : Math.abs(providedTotal - calculatedTotal) < 0.005,
      location,
    });
  }
  return { data, issues };
}
