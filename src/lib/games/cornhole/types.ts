export type CornholeIssue = {
  source: "cornhole";
  rowNumber: number;
  field: string;
  message: string;
};

export type CornholeSession = {
  date: string | null;
  makes: number;
  attempts: number;
  percentage: number;
  sourceRowNumber: number;
};

export type CornholeDrillSummary = {
  drill: "standard" | "airmail";
  label: string;
  sessions: CornholeSession[];
  sessionCount: number;
  totalMakes: number;
  totalAttempts: number;
  weightedPercentage: number | null;
  averageSessionPercentage: number | null;
  recentTenPercentage: number | null;
  bestSession: CornholeSession | null;
};

export type CornholeLibrary = {
  title: string;
  drills: CornholeDrillSummary[];
  issues: CornholeIssue[];
};
