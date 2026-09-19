import type { InvestmentMonth, ValidationIssue } from "./types";
import type { InvestmentData } from "./investing-data";

export type InvestmentAccountSummary = {
  account: string;
  total: number;
  percentage: number | null;
  activeMonths: number;
  latest: InvestmentMonth | null;
};

export type InvestmentDashboardModel = {
  years: number[];
  selectedYear: number | null;
  months: InvestmentMonth[];
  accountSummaries: InvestmentAccountSummary[];
  totalInvested: number;
  startingBalanceTotal: number;
  averageMonthlyContribution: number | null;
  bestMonth: InvestmentMonth | null;
  rollingAverage: Array<{ period: string; total: number; average: number }>;
  coverage: {
    recordedMonths: number;
    expectedMonths: number;
  };
  warnings: ValidationIssue[];
};

export function buildInvestmentDashboardModel(
  data: InvestmentData,
  selectedYear?: number,
): InvestmentDashboardModel {
  const years = [...new Set(data.tabs.map((tab) => Number(tab.title)))]
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
  const populatedYears = new Set(data.months.map((month) => month.year));
  const year = selectedYear && years.includes(selectedYear)
    ? selectedYear
    : [...populatedYears].sort((a, b) => a - b).at(-1) ?? years.at(-1) ?? null;
  const months = data.months
    .filter((month) => year !== null && month.year === year)
    .sort((a, b) => a.month - b.month);
  const totalInvested = months.reduce((sum, month) => sum + month.total, 0);
  const startingBalances = new Map<string, number>();
  for (const month of months) {
    for (const account of month.startingBalances) {
      if (!startingBalances.has(account.account)) startingBalances.set(account.account, account.amount);
    }
  }
  const startingBalanceTotal = [...startingBalances.values()].reduce((sum, amount) => sum + amount, 0);
  const activeMonths = months.filter((month) => month.accounts.length > 0);
  const accountTotals = new Map<string, { total: number; activeMonths: number; latest: InvestmentMonth }>();

  for (const month of months) {
    for (const account of month.accounts) {
      const current = accountTotals.get(account.account);
      accountTotals.set(account.account, {
        total: (current?.total ?? 0) + account.amount,
        activeMonths: (current?.activeMonths ?? 0) + 1,
        latest: month,
      });
    }
  }

  const accountSummaries = [...accountTotals.entries()]
    .map(([account, summary]) => ({
      account,
      total: summary.total,
      percentage: totalInvested > 0 ? summary.total / totalInvested : null,
      activeMonths: summary.activeMonths,
      latest: summary.latest,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    years,
    selectedYear: year,
    months,
    accountSummaries,
    totalInvested,
    startingBalanceTotal,
    averageMonthlyContribution: activeMonths.length
      ? totalInvested / activeMonths.length
      : null,
    bestMonth: months.reduce<InvestmentMonth | null>(
      (best, month) => (!best || month.total > best.total ? month : best),
      null,
    ),
    rollingAverage: months.map((month, index) => {
      const window = months.slice(Math.max(0, index - 2), index + 1);
      return {
        period: month.period,
        total: month.total,
        average: window.reduce((sum, item) => sum + item.total, 0) / window.length,
      };
    }),
    coverage: {
      recordedMonths: months.length,
      expectedMonths: 12,
    },
    warnings: [
      ...data.issues,
      ...months
        .filter((month) => month.totalMatchesAccounts === false)
        .map((month) => ({
          ...month.location,
          field: "Total",
          message: "Provided total differs from account values.",
        })),
    ],
  };
}
