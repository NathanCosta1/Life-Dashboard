import { normalizeLabel, parseCurrency } from "./parsers";
import type { BudgetCategory, BudgetFrequency, BudgetLine, ParseResult, ValidationIssue } from "./types";

const monthlyFactor = (frequency: BudgetFrequency) => frequency === "biweekly" ? 26 / 12 : frequency === "annual" ? 1 / 12 : frequency === "monthly" ? 1 : 0;
const annualFactor = (frequency: BudgetFrequency) => frequency === "biweekly" ? 26 : frequency === "annual" ? 1 : frequency === "monthly" ? 12 : 0;

export function classifyBudgetLabel(label: string): { category: BudgetCategory; ambiguous?: boolean } {
  const value = normalizeLabel(label);
  if (/^pay\b/.test(value)) return { category: "income" };
  if (value.includes("tax")) return { category: "tax" };
  if (value.includes("401k") || value.includes("401(k)")) return { category: "retirement-investing" };
  if (value.includes("espp")) return { category: "other-investing" };
  if (value.includes("fun") || value.includes("savings")) return { category: "flexible-spending" };
  if (value.includes("rent") || value.includes("housing") || value.includes("utilities") || value.includes("fees")) return { category: "housing" };
  if (value.includes("car") || value.includes("gas") || value.includes("insurance") || value.includes("maintain")) return { category: "transportation" };
  if (value.includes("grocer") || value.includes("food")) return { category: "food" };
  if (value.includes("household")) return { category: "household" };
  if (value.includes("subscription")) return { category: "subscriptions" };
  return { category: "unknown" };
}

export function parseBudgetTab(rows: readonly string[][], tab = "Planned"): ParseResult<BudgetLine> {
  const issues: ValidationIssue[] = [];
  let inNathan = false;
  let frequency: BudgetFrequency = "unknown";
  const data: BudgetLine[] = [];
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const cells = row.map((cell) => cell?.trim() ?? "");
    const first = normalizeLabel(cells[0] ?? "");
    const hasNathanHeader = first === "nathan" || cells.some((cell) => normalizeLabel(cell) === "nathan");
    const hasMaddyHeader = first === "maddy" || cells.some((cell) => normalizeLabel(cell) === "maddy");
    if (hasMaddyHeader) inNathan = false;
    if (hasNathanHeader) inNathan = true;
    if (!inNathan) return;
    const frequencyCell = cells.slice(0, 2).find((cell) => normalizeLabel(cell).includes("per biweekly") || normalizeLabel(cell).includes("per month") || normalizeLabel(cell).includes("annual"));
    if (frequencyCell) {
      frequency = normalizeLabel(frequencyCell).includes("biweekly") ? "biweekly" : normalizeLabel(frequencyCell).includes("annual") ? "annual" : "monthly";
      return;
    }
    if (hasNathanHeader) return;
    const sourceLabel = cells[1] || cells[0] || "";
    const label = sourceLabel.replace(/\*/g, "").replace(/\s*\/\s*savings\b/i, "").trim();
    if (!label || /total expenses|frequency/i.test(label)) return;
    const amountCell = cells[2] || cells[1];
    const amount = parseCurrency(amountCell ?? "");
    if (amount === null) return;
    const classified = classifyBudgetLabel(sourceLabel);
    if (classified.category === "unknown") issues.push({ source: "budget", tab, rowNumber, field: "category", message: "Budget line could not be classified.", value: label });
    const factor = monthlyFactor(frequency);
    const note = cells.slice(3).find((cell) => cell.length > 0);
    data.push({ label, person: "Nathan", amount, frequency, category: classified.category, monthly: amount * factor, annual: amount * annualFactor(frequency), rowNumber, note, ambiguous: classified.ambiguous });
  });
  if (!data.length) issues.push({ source: "budget", tab, rowNumber: 1, message: "No Nathan budget lines were found in the Planned tab." });
  return { data, issues };
}
