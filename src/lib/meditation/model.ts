import type {
  MeditationDay,
  MeditationMonth,
  MeditationSession,
  MeditationSummary,
  TimeOfDaySummary,
  MeditationYearData,
} from "./types";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function buildMeditationDays(sessions: readonly MeditationSession[], year: number): MeditationDay[] {
  const byDate = new Map<string, MeditationSession[]>();
  for (const session of sessions) byDate.set(session.date, [...(byDate.get(session.date) ?? []), session]);

  const days: MeditationDay[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const daySessions = byDate.get(date) ?? [];
    const totalMinutes = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    days.push({
      date,
      sessions: daySessions,
      sessionCount: daySessions.length,
      totalMinutes,
      averageMinutes: daySessions.length ? totalMinutes / daySessions.length : 0,
      longestSessionMinutes: daySessions.reduce((max, session) => Math.max(max, session.durationMinutes), 0),
    });
  }
  return days;
}

function streakRuns(active: boolean[]): { longestStreak: number; longestSkipped: number } {
  let streak = 0;
  let skipped = 0;
  let longestStreak = 0;
  let longestSkipped = 0;
  for (let index = 0; index < active.length; index += 1) {
    if (active[index]) { streak += 1; longestStreak = Math.max(longestStreak, streak); skipped = 0; }
    else { skipped += 1; longestSkipped = Math.max(longestSkipped, skipped); streak = 0; }
  }
  return { longestStreak, longestSkipped };
}

function weekdayFromIso(iso: string): string {
  return WEEKDAY_NAMES[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

function currentStreak(days: readonly MeditationDay[]): number {
  let streak = 0;
  let foundActiveDay = false;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!foundActiveDay && days[index].sessionCount === 0) continue;
    foundActiveDay = true;
    if (days[index].sessionCount > 0) streak += 1;
    else break;
  }
  return streak;
}

export function buildMeditationSummary(days: readonly MeditationDay[], sessions: readonly MeditationSession[]): MeditationSummary {
  const activeDays = days.filter((day) => day.sessionCount > 0);
  const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const { longestStreak, longestSkipped } = streakRuns(
    days.map((day) => day.sessionCount > 0),
  );
  const longestDay = activeDays.reduce<MeditationDay | null>((best, day) =>
    !best || day.totalMinutes > best.totalMinutes ? day : best, null);
  const monthActiveDays = MONTH_NAMES.map((label, index) => ({
    label,
    days: activeDays.filter((day) => Number(day.date.slice(5, 7)) === index + 1).length,
  }));
  const mostMonth = monthActiveDays.sort((a, b) => b.days - a.days || MONTH_NAMES.indexOf(a.label) - MONTH_NAMES.indexOf(b.label))[0];
  const weekdayActive = WEEKDAY_NAMES.map((name) => ({
    name,
    days: activeDays.filter((day) => weekdayFromIso(day.date) === name).length,
  }));
  const mostWeekday = weekdayActive.sort((a, b) => b.days - a.days || WEEKDAY_NAMES.indexOf(a.name) - WEEKDAY_NAMES.indexOf(b.name))[0];

  return {
    totalSessions: sessions.length,
    activeDays: activeDays.length,
    skippedDays: days.length - activeDays.length,
    totalMinutes,
    averageSessionMinutes: sessions.length ? totalMinutes / sessions.length : 0,
    averageMinutesPerActiveDay: activeDays.length ? totalMinutes / activeDays.length : 0,
    currentStreak: currentStreak(days),
    longestStreak,
    longestSkippedStreak: longestSkipped,
    longestSessionMinutes: sessions.reduce((max, session) => Math.max(max, session.durationMinutes), 0),
    longestDayMinutes: longestDay?.totalMinutes ?? 0,
    longestDayDate: longestDay?.date ?? null,
    mostActiveMonth: mostMonth?.days ? mostMonth.label : null,
    mostActiveMonthDays: mostMonth?.days ?? 0,
    mostActiveWeekday: mostWeekday?.days ? mostWeekday.name : null,
    mostActiveWeekdayDays: mostWeekday?.days ?? 0,
  };
}

export function buildMeditationYearData(tabName: string, year: number, sessions: readonly MeditationSession[]): MeditationYearData {
  const days = buildMeditationDays(sessions, year);
  const summary = buildMeditationSummary(days, sessions);
  const months: MeditationMonth[] = MONTH_NAMES.map((label, index) => {
    const monthDays = days.filter((day) => Number(day.date.slice(5, 7)) === index + 1);
    return {
      month: index + 1,
      label,
      activeDays: monthDays.filter((day) => day.sessionCount > 0).length,
      totalMinutes: monthDays.reduce((sum, day) => sum + day.totalMinutes, 0),
    };
  });
  const weekdayTotals = WEEKDAY_NAMES.map((name) => {
    const matching = days.filter((day) => weekdayFromIso(day.date) === name);
    return {
      name,
      activeDays: matching.filter((day) => day.sessionCount > 0).length,
      totalMinutes: matching.reduce((sum, day) => sum + day.totalMinutes, 0),
    };
  });
  const names = ["Morning", "Midday", "Evening", "Night"] as const;
  const timeOfDay: TimeOfDaySummary[] = names.map((name) => {
    const matching = sessions.filter((session) => session.timeOfDay === name);
    const totalMinutes = matching.reduce((sum, session) => sum + session.durationMinutes, 0);
    return {
      name,
      sessionCount: matching.length,
      totalMinutes,
      averageMinutes: matching.length ? totalMinutes / matching.length : 0,
      share: sessions.length ? (matching.length / sessions.length) * 100 : 0,
    };
  });
  return { year, tabName, sessions: [...sessions], days, summary, months, weekdayTotals, timeOfDay };
}
