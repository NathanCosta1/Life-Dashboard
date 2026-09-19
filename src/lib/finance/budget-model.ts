import type { BudgetCategory, BudgetData, BudgetLine, BudgetMetrics } from "./types";

export function buildBudgetMetrics(lines: BudgetLine[]): BudgetMetrics {
  const income = lines.filter((line) => line.category === "income").reduce((sum, line) => sum + line.monthly, 0);
  const taxes = lines.filter((line) => line.category === "tax").reduce((sum, line) => sum + line.monthly, 0);
  const spending = lines.filter((line) => !["income", "tax", "retirement-investing", "other-investing", "unallocated"].includes(line.category)).reduce((sum, line) => sum + line.monthly, 0);
  const investing = lines.filter((line) => ["retirement-investing", "other-investing"].includes(line.category)).reduce((sum, line) => sum + line.monthly, 0);
  const freeToInvest = income - taxes - spending - investing;
  return { income, taxes, spending, investing, freeToInvest, savingsRate: income > 0 ? investing / income : 0 };
}

export function budgetLineWithCategory(line: BudgetLine, category: BudgetCategory, monthlyAmount: number): BudgetLine {
  return { ...line, category, monthly: monthlyAmount, annual: monthlyAmount * 12, amount: line.frequency === "biweekly" ? monthlyAmount * 12 / 26 : monthlyAmount };
}

export function buildBudgetDashboardModel(data: BudgetData) {
  return { ...data, metrics: buildBudgetMetrics(data.lines) };
}
