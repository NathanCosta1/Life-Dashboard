export type ScreenTimeOwner = "Nathan" | "Maddy";

export type ScreenTimeIssue = {
  source: "screen-time";
  owner: ScreenTimeOwner;
  rowNumber: number;
  field: string;
  message: string;
};

export type ScreenTimeWeek = {
  label: string;
  dailyAverageHours: number | null;
  hoursSoFar: number | null;
  onPaceHours: number | null;
  note: string | null;
  imputed: boolean;
  sourceRowNumber: number;
};

export type ScreenTimeExtraDay = {
  label: string;
  hours: number | null;
  note: string | null;
  imputed: boolean;
  sourceRowNumber: number;
};

export type ScreenTimeSummary = {
  owner: ScreenTimeOwner;
  weeks: ScreenTimeWeek[];
  extraDays: ScreenTimeExtraDay[];
  weekCount: number;
  latestHours: number | null;
  sourceTotalHours: number | null;
  latestOnPaceHours: number | null;
  averageDailyHours: number | null;
  recentFourWeekAverage: number | null;
  highestWeekAverage: ScreenTimeWeek | null;
  lowestWeekAverage: ScreenTimeWeek | null;
  remainingToGoal: number | null;
  paceDifference: number | null;
  projectedAnnualHours: number | null;
};

export type ScreenTimeLibrary = {
  title: string;
  year: 2026;
  goalHours: 1000;
  people: ScreenTimeSummary[];
  issues: ScreenTimeIssue[];
};
