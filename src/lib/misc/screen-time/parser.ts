import type {
  ScreenTimeExtraDay,
  ScreenTimeIssue,
  ScreenTimeLibrary,
  ScreenTimeOwner,
  ScreenTimeSummary,
  ScreenTimeWeek,
} from "./types";

const weekPattern = /^(\d{1,2})\/(\d{1,2})\s+-\s+(\d{1,2})\/(\d{1,2})\s*$/;
const extraDayPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i;

function cleanNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function parseOwner(
  owner: ScreenTimeOwner,
  rows: readonly (readonly string[])[],
  issues: ScreenTimeIssue[],
): ScreenTimeSummary {
  const weeks: ScreenTimeWeek[] = [];
  const extraDays: ScreenTimeExtraDay[] = [];
  let sourceTotalHours: number | null = null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const rowNumber = index + 1;
    const rawWeek = String(row[0] ?? "").trim();
    const rawDaily = String(row[1] ?? "").trim();
    const rawWeekNote = String(row[2] ?? "").trim();
    const rawHoursSoFar = String(row[3] ?? "").trim();
    const rawOnPace = String(row[4] ?? "").trim();
    const rawExtraLabel = String(row[6] ?? "").trim();
    const rawExtraValue = String(row[7] ?? "").trim();
    const rawExtraNote = String(row[8] ?? "").trim();

    if (weekPattern.test(rawWeek)) {
      const dailyAverageHours = cleanNumber(rawDaily);
      const hoursSoFar = cleanNumber(rawHoursSoFar);
      const onPaceHours = cleanNumber(rawOnPace);
      const nonNumericNote = rawWeekNote && !cleanNumber(rawWeekNote) ? rawWeekNote : null;
      const note = nonNumericNote;
      const imputed = Boolean(note && /imput/i.test(note));

      if (!dailyAverageHours && rawDaily) {
        issues.push({ source: "screen-time", owner, rowNumber, field: "AVG", message: "Daily average could not be parsed." });
      }
      if (dailyAverageHours !== null && dailyAverageHours < 0) {
        issues.push({ source: "screen-time", owner, rowNumber, field: "AVG", message: "Daily average is negative." });
      }
      weeks.push({
        label: rawWeek,
        dailyAverageHours,
        hoursSoFar,
        onPaceHours,
        note,
        imputed,
        sourceRowNumber: rowNumber,
      });
    } else if (rawWeek && rawWeek.toLowerCase() !== "week" && rawWeek && !/total/i.test(rawWeek)) {
      if (!rawWeek.includes("Hours")) {
        // Source text outside the expected week block is intentionally reported.
        issues.push({ source: "screen-time", owner, rowNumber, field: "WEEK", message: `Unexpected week label "${rawWeek}".` });
      }
    }

    if (/^total\s+hours$/i.test(rawExtraLabel)) {
      sourceTotalHours = cleanNumber(rawExtraValue);
      if (!sourceTotalHours && rawExtraValue) {
        issues.push({ source: "screen-time", owner, rowNumber, field: "Total Hours", message: "Source total could not be parsed." });
      }
    } else if (extraDayPattern.test(rawExtraLabel)) {
      const hours = cleanNumber(rawExtraValue);
      const note = rawExtraNote || null;
      const imputed = Boolean(note && /imput/i.test(note)) || Boolean(rawExtraLabel && hours !== null && /imput/i.test(String(row[8] ?? "")));
      if (!hours && rawExtraValue) {
        issues.push({ source: "screen-time", owner, rowNumber, field: rawExtraLabel, message: "Extra-day value could not be parsed." });
      }
      extraDays.push({
        label: rawExtraLabel,
        hours,
        note,
        imputed,
        sourceRowNumber: rowNumber,
      });
    }
  }

  const validDaily = weeks.map((week) => week.dailyAverageHours).filter((value): value is number => value !== null);
  const validHours = weeks.map((week) => week.hoursSoFar).filter((value): value is number => value !== null);
  const latestHours = validHours.length ? validHours[validHours.length - 1] : null;
  const latestOnPace = weeks.map((week) => week.onPaceHours).filter((value): value is number => value !== null).at(-1) ?? null;
  const highestWeekAverage = weeks.reduce<ScreenTimeWeek | null>((best, week) =>
    week.dailyAverageHours !== null && (!best || best.dailyAverageHours === null || week.dailyAverageHours > (best.dailyAverageHours ?? -Infinity)) ? week : best, null);
  const lowestWeekAverage = weeks.reduce<ScreenTimeWeek | null>((best, week) =>
    week.dailyAverageHours !== null && (!best || best.dailyAverageHours === null || week.dailyAverageHours < (best.dailyAverageHours ?? Infinity)) ? week : best, null);
  const recentFour = weeks.slice(-4).map((week) => week.dailyAverageHours).filter((value): value is number => value !== null);
  const elapsedWeekCount = validHours.length;
  const projectedAnnualHours = elapsedWeekCount >= 2 && latestHours !== null
    ? latestHours / elapsedWeekCount * 52
    : null;

  return {
    owner,
    weeks,
    extraDays,
    weekCount: weeks.length,
    latestHours,
    sourceTotalHours,
    latestOnPaceHours: latestOnPace,
    averageDailyHours: validDaily.length ? validDaily.reduce((sum, value) => sum + value, 0) / validDaily.length : null,
    recentFourWeekAverage: recentFour.length ? recentFour.reduce((sum, value) => sum + value, 0) / recentFour.length : null,
    highestWeekAverage,
    lowestWeekAverage,
    remainingToGoal: latestHours !== null ? 1000 - latestHours : null,
    paceDifference: latestHours !== null && latestOnPace !== null ? latestHours - latestOnPace : null,
    projectedAnnualHours,
  };
}

export function parseScreenTimeLibrary(
  nathanRows: readonly (readonly string[])[],
  maddyRows: readonly (readonly string[])[],
): ScreenTimeLibrary {
  const issues: ScreenTimeIssue[] = [];
  return {
    title: "2026 Phone Screen Time",
    year: 2026,
    goalHours: 1000,
    people: [
      parseOwner("Nathan", nathanRows, issues),
      parseOwner("Maddy", maddyRows, issues),
    ],
    issues,
  };
}
