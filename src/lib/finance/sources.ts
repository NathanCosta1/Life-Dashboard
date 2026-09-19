import type { SourceName } from "./types";

export type FinanceSourceConfig = {
  name: SourceName;
  environmentVariable: string;
  defaultTabs: readonly string[];
  ranges: Readonly<Record<string, string>>;
  discoveryRange: string;
  revalidateSeconds: number;
  status: "structured-blocks" | "wide-table" | "semi-structured";
};

export const financeSources: Record<SourceName, FinanceSourceConfig> = {
  netWorth: {
    name: "netWorth",
    environmentVariable: "GOOGLE_SHEET_ID_NET_WORTH",
    defaultTabs: ["Net Worth", "Income", "Expenses", "Net Worth Milestones"],
    ranges: {
      netWorth: "'Net Worth'!A1:F100",
      income: "'Income'!A1:B100",
      expenses: "'Expenses'!A1:B100",
      milestones: "'Net Worth Milestones'!A1:C100",
    },
    discoveryRange: "A1:Z100",
    revalidateSeconds: 60 * 60,
    status: "structured-blocks",
  },
  investing: {
    name: "investing",
    environmentVariable: "GOOGLE_SHEET_ID_INVESTING",
    defaultTabs: ["2026", "2027"],
    ranges: {
      yearlyTabs: "A1:Z100",
    },
    discoveryRange: "A1:Z100",
    revalidateSeconds: 60 * 60,
    status: "wide-table",
  },
  vacationFinances: {
    name: "vacationFinances",
    environmentVariable: "GOOGLE_SHEET_ID_VACATION_FINANCES",
    defaultTabs: ["Mt Marcy", "Mexico Cruise", "WVA Hike", "Mt Rogers (fail)"],
    ranges: {
      tripTabs: "A1:I100",
    },
    discoveryRange: "A1:Z100",
    revalidateSeconds: 6 * 60 * 60,
    status: "semi-structured",
  },
  housing: {
    name: "housing",
    environmentVariable: "GOOGLE_SHEET_ID_HOUSING",
    defaultTabs: ["HV - RVA"],
    ranges: {
      apartment: "'HV - RVA'!A1:I40",
    },
    discoveryRange: "A1:Z100",
    revalidateSeconds: 6 * 60 * 60,
    status: "semi-structured",
  },
  budget: {
    name: "budget",
    environmentVariable: "GOOGLE_SHEET_ID_BUDGET",
    defaultTabs: ["Planned"],
    ranges: { planned: "'Planned'!A1:Z100" },
    discoveryRange: "A1:Z100",
    revalidateSeconds: 60 * 60,
    status: "semi-structured",
  },
};

export function getSpreadsheetId(source: SourceName): string {
  const environmentVariable = financeSources[source].environmentVariable;
  const spreadsheetId = process.env[environmentVariable];

  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${environmentVariable}.`);
  }

  return spreadsheetId;
}

export function getSourceTag(source: SourceName): string {
  return `finance:${source}`;
}
