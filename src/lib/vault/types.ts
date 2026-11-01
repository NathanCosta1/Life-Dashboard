export type VaultEvent = {
  id: string;
  date: string;
  time: string | null;
  streak: number | null;
  year: number;
  sourceRow: number;
};

export type VaultLibrary = {
  events: VaultEvent[];
  totalEvents: number;
  currentStreak: number;
  longestStreak: number;
  longestStreakStart: string | null;
  longestStreakEnd: string | null;
  monthlyCounts: { month: string; count: number }[];
  dayOfWeekCounts: { day: string; count: number }[];
  hourlyCounts: { hour: number; count: number }[];
  yearCounts: { year: number; count: number }[];
};
