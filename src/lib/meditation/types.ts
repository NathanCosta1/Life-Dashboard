export type TimeOfDay = "Morning" | "Midday" | "Evening" | "Night";

export type MeditationSession = {
  sourceRow: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  streak: number | null;
  startHour: number | null;
  timeOfDay: TimeOfDay | null;
  notes: string | null;
};

export type MeditationDay = {
  date: string;
  sessions: MeditationSession[];
  sessionCount: number;
  totalMinutes: number;
  averageMinutes: number;
  longestSessionMinutes: number;
};

export type MeditationSummary = {
  totalSessions: number;
  activeDays: number;
  skippedDays: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  averageMinutesPerActiveDay: number;
  currentStreak: number;
  longestStreak: number;
  longestSkippedStreak: number;
  longestSessionMinutes: number;
  longestDayMinutes: number;
  longestDayDate: string | null;
  mostActiveMonth: string | null;
  mostActiveMonthDays: number;
  mostActiveWeekday: string | null;
  mostActiveWeekdayDays: number;
};

export type MeditationMonth = {
  month: number;
  label: string;
  activeDays: number;
  totalMinutes: number;
};

export type TimeOfDaySummary = {
  name: TimeOfDay;
  sessionCount: number;
  totalMinutes: number;
  averageMinutes: number;
  share: number;
};

export type MeditationYearData = {
  year: number;
  tabName: string;
  sessions: MeditationSession[];
  days: MeditationDay[];
  summary: MeditationSummary;
  months: MeditationMonth[];
  weekdayTotals: { name: string; activeDays: number; totalMinutes: number }[];
  timeOfDay: TimeOfDaySummary[];
};

export type MeditationData = {
  years: MeditationYearData[];
  activeYear: number | null;
};
