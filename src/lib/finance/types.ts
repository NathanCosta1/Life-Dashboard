export type SourceName = "netWorth" | "investing" | "vacationFinances" | "housing";

export type SourceLocation = {
  source: SourceName;
  tab: string;
  rowNumber: number;
};

export type ValidationIssue = SourceLocation & {
  field?: string;
  message: string;
  value?: string;
};

export type ParseResult<T> = {
  data: T[];
  issues: ValidationIssue[];
};

export type NetWorthPoint = {
  year: number;
  netWorth: number;
  location: SourceLocation;
};

export type AnnualMetricPoint = {
  year: number;
  value: number;
  metric: "income" | "expenses";
  location: SourceLocation;
};

export type InvestmentAccountValue = {
  account: string;
  amount: number;
  columnIndex: number;
};

export type InvestmentMonth = {
  period: string;
  year: number;
  month: number;
  accounts: InvestmentAccountValue[];
  startingBalances: InvestmentAccountValue[];
  providedTotal: number | null;
  calculatedTotal: number;
  total: number;
  totalMatchesAccounts: boolean | null;
  location: SourceLocation;
};

export type RawSourceRow = {
  cells: string[];
  location: SourceLocation;
};

export type VacationTrip = {
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  year: number | null;
  durationDays: number | null;
  total: number | null;
  perPersonTotal: number | null;
  expenses: Array<{ label: string; amount: number; rowNumber: number }>;
  rows: RawSourceRow[];
  location: SourceLocation;
};

export type HousingSnapshot = {
  label: string;
  value: string;
  location: SourceLocation;
};

export type HousingMonthlyCost = {
  month: string;
  total: number | null;
  categories: Record<string, number | null>;
  location: SourceLocation;
};
