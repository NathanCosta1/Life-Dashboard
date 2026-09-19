import type { HousingSnapshot, ParseResult, RawSourceRow, VacationTrip } from "./types";
import { parseVacationTab as parseNormalizedVacationTab } from "./vacations";

function rawRows(
  rows: readonly (readonly string[])[],
  source: "vacationFinances" | "housing",
  tab: string,
): RawSourceRow[] {
  return rows.flatMap((cells, index) =>
    cells.some((cell) => cell.trim())
      ? [{ cells: [...cells], location: { source, tab, rowNumber: index + 1 } }]
      : [],
  );
}

export function parseVacationTab(
  rows: readonly (readonly string[])[],
  tab: string,
): ParseResult<VacationTrip> {
  return parseNormalizedVacationTab(rows, tab);
}

export function parseHousingTab(
  rows: readonly (readonly string[])[],
  tab = "HV - RVA",
): ParseResult<HousingSnapshot> {
  return {
    data: rawRows(rows, "housing", tab).flatMap((row) => {
      const [label, value] = row.cells;
      return label?.trim() && value?.trim()
        ? [{ label: label.trim(), value: value.trim(), location: row.location }]
        : [];
    }),
    issues: [],
  };
}
