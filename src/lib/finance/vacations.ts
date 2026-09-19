import { normalizeLabel, parseCurrency } from "./parsers";
import type { ParseResult, RawSourceRow, VacationTrip } from "./types";

const dateRangePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/;

function parseDatePart(value: string) {
  const [month, day, year] = value.split("/").map(Number);
  if (!month || !day || !year) return null;
  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(Date.UTC(fullYear, month - 1, day));
}

function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function parseVacationTab(rows: readonly (readonly string[])[], tab: string): ParseResult<VacationTrip> {
  const rawRows: RawSourceRow[] = rows.flatMap((cells, index) =>
    cells.some((cell) => cell.trim())
      ? [{ cells: [...cells], location: { source: "vacationFinances", tab, rowNumber: index + 1 } }]
      : [],
  );
  const titleCell = rows.flatMap((row) => row).find((cell) => dateRangePattern.test(cell))?.trim() ?? "";
  const dateMatch = titleCell.match(dateRangePattern);
  const start = dateMatch ? parseDatePart(dateMatch[1]) : null;
  const end = dateMatch ? parseDatePart(dateMatch[2]) : null;
  const expenses = rawRows
    .filter((row) => normalizeLabel(row.cells[0] ?? "") !== "expense")
    .flatMap((row) => {
      const label = row.cells[0]?.trim() ?? "";
      const amount = parseCurrency(row.cells[1] ?? "");
      return label && amount !== null && !normalizeLabel(label).includes("total") && !normalizeLabel(label).includes("paid")
        ? [{ label, amount, rowNumber: row.location.rowNumber }]
        : [];
    });
  const totalRow = rawRows.find((row) => normalizeLabel(row.cells[0] ?? "").replace(/\s+/g, " ") === "grand total" || normalizeLabel(row.cells[0] ?? "") === "total");
  const perPersonRow = rawRows.find((row) => normalizeLabel(row.cells[0] ?? "").includes("per person"));
  const durationDays = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1 : null;
  return {
    data: [{
      name: tab,
      dateLabel: dateMatch?.[0] ?? null,
      startDate: formatDate(start),
      endDate: formatDate(end),
      year: start?.getUTCFullYear() ?? null,
      durationDays,
      total: totalRow ? parseCurrency(totalRow.cells[1] ?? "") : null,
      perPersonTotal: perPersonRow ? parseCurrency(perPersonRow.cells[1] ?? "") : null,
      expenses,
      rows: rawRows,
      location: { source: "vacationFinances", tab, rowNumber: 1 },
    }],
    issues: [],
  };
}
