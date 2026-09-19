import type { ValidationIssue } from "./types";
import type { NetWorthData } from "./net-worth-data";

export type NetWorthDashboardModel = {
  points: NetWorthData["netWorth"];
  latest: NetWorthData["netWorth"][number] | null;
  change: number | null;
  income: NetWorthData["income"];
  expenses: NetWorthData["expenses"];
  warnings: ValidationIssue[];
};

export function buildNetWorthDashboardModel(data: NetWorthData): NetWorthDashboardModel {
  const points = [...data.netWorth].sort((a, b) => a.year - b.year);
  const latest = points.at(-1) ?? null;
  const previous = points.at(-2) ?? null;
  return {
    points,
    latest,
    change: latest && previous ? latest.netWorth - previous.netWorth : null,
    income: [...data.income].sort((a, b) => a.year - b.year),
    expenses: [...data.expenses].sort((a, b) => a.year - b.year),
    warnings: data.issues,
  };
}
