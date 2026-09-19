import { normalizeLabel, parseCurrency } from "./parsers";
import type { HousingMonthlyCost, HousingSnapshot, ParseResult } from "./types";

export type HousingWorkbook = {
  moveIn: HousingSnapshot[];
  items: HousingSnapshot[];
  monthly: HousingMonthlyCost[];
};

export function parseHousingWorkbook(rows: readonly (readonly string[])[], tab = "HV - RVA"): ParseResult<HousingWorkbook> {
  const moveIn: HousingSnapshot[] = [];
  const items: HousingSnapshot[] = [];
  const monthly: HousingMonthlyCost[] = [];
  let section: "moveIn" | "items" | "monthly" | null = null;
  let monthlyHeaders: string[] = [];

  rows.forEach((row, index) => {
    const location = { source: "housing" as const, tab, rowNumber: index + 1 };
    const first = normalizeLabel(row[0] ?? "");
    if (first === "move in") { section = "moveIn"; return; }
    if (first === "items") { section = "items"; return; }
    if (first === "monthly") { section = "monthly"; return; }
    if (section === "monthly" && first === "month") {
      monthlyHeaders = row.map((cell) => cell.trim());
      return;
    }
    if (section === "monthly" && monthlyHeaders.length && row[0]?.trim() && /^[A-Za-z]+ \d{4}$/.test(row[0].trim())) {
      const categories = Object.fromEntries(monthlyHeaders.slice(1, -1).map((header, categoryIndex) => [header, parseCurrency(row[categoryIndex + 1] ?? "")]));
      const listedTotal = parseCurrency(row[monthlyHeaders.length - 1] ?? "");
      const calculatedTotal = Object.values(categories).reduce<number | null>((sum, value) => value === null ? sum : (sum ?? 0) + value, null);
      monthly.push({ month: row[0].trim(), total: listedTotal ?? calculatedTotal, categories, location });
      return;
    }
    if ((section === "moveIn" || section === "items") && row[0]?.trim() && row[1]?.trim() && first !== "item" && !first.includes("total")) {
      (section === "moveIn" ? moveIn : items).push({ label: row[0].trim(), value: row[1].trim(), location });
    }
  });

  return { data: [{ moveIn, items, monthly }], issues: [] };
}
