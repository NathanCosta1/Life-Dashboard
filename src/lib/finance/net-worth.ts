import type { AnnualMetricPoint, NetWorthPoint, ParseResult, SourceLocation } from "./types";
import { findHeaderIndex, normalizeLabel, parseCurrency, parseYear } from "./parsers";

function issue(
  location: SourceLocation,
  message: string,
  field: string,
  value?: string,
) {
  return { ...location, field, message, value };
}

export function parseNetWorthPoints(
  rows: readonly (readonly string[])[],
  tab = "Net Worth",
): ParseResult<NetWorthPoint> {
  const data: NetWorthPoint[] = [];
  const issues = [];
  const headerIndex = rows.findIndex(
    (row) =>
      findHeaderIndex(row, (cell) => cell === "year") !== -1 &&
      findHeaderIndex(row, (cell) => cell === "net worth") !== -1,
  );

  if (headerIndex === -1) {
    return {
      data,
      issues: [
        issue(
          { source: "netWorth", tab, rowNumber: 1 },
          "Could not find a Year and Net Worth block.",
          "headers",
        ),
      ],
    };
  }

  const header = rows[headerIndex];
  const yearIndex = findHeaderIndex(header, (cell) => cell === "year");
  const netWorthIndex = findHeaderIndex(header, (cell) => cell === "net worth");

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.every((cell) => !cell.trim())) continue;

    const location = { source: "netWorth" as const, tab, rowNumber: index + 1 };
    const year = parseYear(row[yearIndex] ?? "");
    const netWorth = parseCurrency(row[netWorthIndex] ?? "");
    if (year === null && netWorth === null) continue;
    if (year === null) issues.push(issue(location, "Invalid year.", "year", row[yearIndex]));
    if (netWorth === null) {
      issues.push(issue(location, "Invalid net worth amount.", "netWorth", row[netWorthIndex]));
    }
    if (year !== null && netWorth !== null) data.push({ year, netWorth, location });
  }

  return { data, issues };
}

export function parseAnnualMetric(
  rows: readonly (readonly string[])[],
  metric: "income" | "expenses",
  tab = metric === "income" ? "Income" : "Expenses",
): ParseResult<AnnualMetricPoint> {
  const data: AnnualMetricPoint[] = [];
  const issues = [];
  const headerIndex = rows.findIndex((row) => {
    const yearIndex = findHeaderIndex(row, (cell) => cell === "year");
    const metricIndex = findHeaderIndex(row, (cell) => {
      const label = normalizeLabel(cell);
      return label === metric || label.endsWith(` ${metric}`);
    });
    return yearIndex !== -1 && metricIndex !== -1;
  });

  if (headerIndex === -1) {
    return {
      data,
      issues: [issue({ source: "netWorth", tab, rowNumber: 1 }, "Required headers were not found.", "headers")],
    };
  }

  const header = rows[headerIndex];
  const yearIndex = findHeaderIndex(header, (cell) => cell === "year");
  const valueIndex = findHeaderIndex(header, (cell) => {
    const label = normalizeLabel(cell);
    return label === metric || label.endsWith(` ${metric}`);
  });
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.every((cell) => !cell.trim())) continue;
    const location = { source: "netWorth" as const, tab, rowNumber: index + 1 };
    const year = parseYear(row[yearIndex] ?? "");
    const value = parseCurrency(row[valueIndex] ?? "");
    if (year === null && value === null) continue;
    if (year === null) issues.push(issue(location, "Invalid year.", "year", row[yearIndex]));
    if (value === null) issues.push(issue(location, `Invalid ${metric} amount.`, metric, row[valueIndex]));
    if (year !== null && value !== null) data.push({ year, value, metric, location });
  }
  return { data, issues };
}
