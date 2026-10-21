import type { BudgetCategory, BudgetData, BudgetLine, BudgetMetrics } from "./types";

export type BudgetAllocations = {
  income: number;
  taxes: number;
  investing: number;
  fun: number;
  savings: number;
  living: number;
  car: number;
  groceries: number;
};

export type BudgetBenefitAssumptions = {
  employerMatchPercent: number;
  esppDiscountPercent: number;
  rothIraMaxed: boolean;
};

export type BudgetBenefitEstimates = {
  eligibleAnnualPay: number;
  annualEmployee401k: number;
  annualEmployerMatch: number;
  annualEsppContribution: number;
  annualEsppDiscountValue: number;
  rothIraMaxed: boolean;
};

export const defaultBudgetBenefitAssumptions: BudgetBenefitAssumptions = {
  employerMatchPercent: 7.5,
  esppDiscountPercent: 15,
  rothIraMaxed: true,
};

export function calculateEmployerMatch(
  eligibleAnnualPay: number,
  annualEmployeeContribution: number,
  matchPercent: number,
) {
  const matchCap = Math.max(0, eligibleAnnualPay) * Math.max(0, matchPercent) / 100;
  return Math.min(Math.max(0, annualEmployeeContribution), matchCap);
}

export function calculateEsppDiscountValue(annualContribution: number, discountPercent: number) {
  const discount = Math.min(99, Math.max(0, discountPercent)) / 100;
  return Math.max(0, annualContribution) * discount / (1 - discount);
}

export function buildBudgetBenefitEstimates(
  lines: BudgetLine[],
  assumptions: BudgetBenefitAssumptions,
): BudgetBenefitEstimates {
  const annualAmount = (category: BudgetCategory) =>
    lines.filter((line) => line.category === category).reduce((sum, line) => sum + line.annual, 0);
  const annual401k = lines
    .filter((line) => line.category === "retirement-investing" && /401\s*\(?k\)?/i.test(line.label))
    .reduce((sum, line) => sum + line.annual, 0);
  const annualEspp = lines
    .filter((line) => line.category === "other-investing" && /espp/i.test(line.label))
    .reduce((sum, line) => sum + line.annual, 0);
  const eligibleAnnualPay = annualAmount("income");

  return {
    eligibleAnnualPay,
    annualEmployee401k: annual401k,
    annualEmployerMatch: calculateEmployerMatch(eligibleAnnualPay, annual401k, assumptions.employerMatchPercent),
    annualEsppContribution: annualEspp,
    annualEsppDiscountValue: calculateEsppDiscountValue(annualEspp, assumptions.esppDiscountPercent),
    rothIraMaxed: assumptions.rothIraMaxed,
  };
}

export function layoutBudgetFlowNodes<T extends { amount: number }>(
  nodes: T[],
  scale: number,
  top = 56,
  gap = 18,
  minHeight = 72,
) {
  let y = top;
  return nodes.map((node) => {
    const bandHeight = Math.max(0, node.amount * scale);
    const height = Math.max(minHeight, bandHeight);
    const position = { ...node, y, height, center: y + height / 2, bandHeight };
    y += height + gap;
    return position;
  });
}

const sumMonthly = (lines: BudgetLine[], categories: BudgetCategory[]) =>
  lines.filter((line) => categories.includes(line.category)).reduce((sum, line) => sum + line.monthly, 0);

export function buildBudgetAllocations(lines: BudgetLine[]): BudgetAllocations {
  return {
    income: sumMonthly(lines, ["income"]),
    taxes: sumMonthly(lines, ["tax"]),
    investing: sumMonthly(lines, ["retirement-investing", "other-investing"]),
    fun: sumMonthly(lines, ["flexible-spending"]),
    savings: 0,
    living: sumMonthly(lines, ["housing", "household", "subscriptions", "unknown"]),
    car: sumMonthly(lines, ["transportation"]),
    groceries: sumMonthly(lines, ["food"]),
  };
}

export function buildBudgetMetrics(allocations: BudgetAllocations): BudgetMetrics {
  const spending = allocations.fun + allocations.living + allocations.car + allocations.groceries;
  const allocated = allocations.taxes + allocations.investing + allocations.savings + spending;
  const remainder = allocations.income - allocated;
  const freeToInvest = Math.abs(remainder) < 0.01 ? 0 : remainder;
  const saved = allocations.investing + allocations.savings;
  return {
    income: allocations.income,
    taxes: allocations.taxes,
    spending,
    investing: allocations.investing,
    freeToInvest,
    savingsRate: allocations.income > 0 ? saved / allocations.income : 0,
  };
}

export function budgetLineWithCategory(line: BudgetLine, category: BudgetCategory, monthlyAmount: number): BudgetLine {
  return { ...line, category, monthly: monthlyAmount, annual: monthlyAmount * 12, amount: line.frequency === "biweekly" ? monthlyAmount * 12 / 26 : monthlyAmount };
}

export function buildBudgetDashboardModel(data: BudgetData) {
  const allocations = buildBudgetAllocations(data.lines);
  return { ...data, allocations, metrics: buildBudgetMetrics(allocations) };
}
