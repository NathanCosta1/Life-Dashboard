export type BasketballIssue = {
  source: "basketball";
  rowNumber: number;
  field: string;
  message: string;
};

export type BasketballSession = {
  date: string | null;
  makes: number;
  attempts: number;
  percentage: number;
  sourceRowNumber: number;
};

export type BasketballDrillSummary = {
  drill: "free-throws" | "three-pointers";
  label: string;
  sessions: BasketballSession[];
  sessionCount: number;
  totalMakes: number;
  totalAttempts: number;
  weightedPercentage: number | null;
  averageSessionPercentage: number | null;
  recentTenPercentage: number | null;
  bestSession: BasketballSession | null;
};

export type BasketballLibrary = {
  title: string;
  drills: BasketballDrillSummary[];
  issues: BasketballIssue[];
};
