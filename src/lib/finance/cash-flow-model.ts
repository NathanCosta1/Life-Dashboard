import type { AnnualMetricPoint, ValidationIssue } from "./types";
import type { NetWorthData } from "./net-worth-data";

export type CashFlowYear = {
  year: number;
  income: AnnualMetricPoint | null;
  expenses: AnnualMetricPoint | null;
  savings: number | null;
  savingsRate: number | null;
};

export type CashFlowDashboardModel = {
  years: CashFlowYear[];
  latest: CashFlowYear | null;
  warnings: ValidationIssue[];
};

export function buildCashFlowDashboardModel(data: Pick<NetWorthData, "income" | "expenses" | "issues">): CashFlowDashboardModel {
  const years = [...new Set([...data.income, ...data.expenses].map((point) => point.year))].sort((a, b) => a - b);
  const rows = years.map((year) => {
    const income = data.income.find((point) => point.year === year) ?? null;
    const expenses = data.expenses.find((point) => point.year === year) ?? null;
    const savings = income && expenses ? income.value - expenses.value : null;
    return {
      year,
      income,
      expenses,
      savings,
      savingsRate: savings !== null && income?.value ? savings / income.value : null,
    };
  });
  return { years: rows, latest: rows.at(-1) ?? null, warnings: data.issues };
}
