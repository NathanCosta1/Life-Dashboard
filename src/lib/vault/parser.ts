import type { VaultEvent, VaultLibrary } from "./types";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function parseDate(value: string, year: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let date: Date | null = null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const slash = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(trimmed);
  if (iso) {
    const [, y, m, d] = iso;
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else if (slash) {
    const [, m, d, rawYear] = slash;
    const parsedYear = rawYear
      ? rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear)
      : year;
    date = new Date(parsedYear, Number(m) - 1, Number(d));
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() < 0 || date.getMonth() > 11) return null;
  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const check = new Date(`${isoDate}T12:00:00`);
  return check.getFullYear() === date.getFullYear() &&
    check.getMonth() === date.getMonth() &&
    check.getDate() === date.getDate() ? isoDate : null;
}

function parseStreak(value: string | undefined): number | null {
  const trimmed = String(value ?? "").trim();
  if (!/^[-]?\d+$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function parseHour(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "AM") hour = hour === 12 ? 0 : hour;
    if (meridiem === "PM") hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    return null;
  }
  return hour;
}

export function parseVaultLibrary(
  tabs: Record<number, readonly (readonly string[])[]>,
): VaultLibrary {
  const events: VaultEvent[] = [];
  const seen = new Set<string>();

  for (const [yearText, rows] of Object.entries(tabs)) {
    const year = Number(yearText);
    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      const date = parseDate(String(row[0] ?? ""), year);
      if (!date) continue;
      const streakColumn = year === 2026 ? 2 : year === 2025 ? 1 : 3;
      const streak = parseStreak(row[streakColumn]);
      const time = year === 2026 ? String(row[1] ?? "").trim() || null : null;
      const hour = time ? parseHour(time) : null;
      const key = `${date}|${time ?? ""}|${streak ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        id: `vault-${year}-${index}`,
        date,
        time,
        streak,
        year,
        sourceRow: index + 1,
      });
      if (year === 2026 && hour === null && time) {
        // Time text remains displayable, but malformed values never become hours.
        events[events.length - 1].time = time;
      }
    }
  }

  events.sort((a, b) => `${b.date}${b.time ?? ""}`.localeCompare(`${a.date}${a.time ?? ""}`));

  const monthlyCounts = MONTHS.map((month, monthIndex) => ({
    month,
    count: events.filter((event) => new Date(`${event.date}T12:00:00`).getMonth() === monthIndex).length,
  }));
  const dayOfWeekCounts = DAYS.map((day, dayIndex) => ({
    day,
    count: events.filter((event) => new Date(`${event.date}T12:00:00`).getDay() === dayIndex).length,
  }));
  const hourlyCounts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: events.filter((event) => event.time && parseHour(event.time) === hour).length,
  }));
  const yearCounts = Array.from(new Set(events.map((event) => event.year)))
    .sort((a, b) => b - a)
    .map((year) => ({ year, count: events.filter((event) => event.year === year).length }));

  let longestStreak = 0;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  for (const event of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    if (event.streak !== null && event.streak > longestStreak) {
      longestStreak = event.streak;
      longestStart = event.date;
      longestEnd = event.date;
    }
  }
  const newest = events[0];
  const currentStreak = newest?.streak ?? 0;

  return {
    events,
    totalEvents: events.length,
    currentStreak,
    longestStreak,
    longestStreakStart: longestStart,
    longestStreakEnd: longestEnd,
    monthlyCounts,
    dayOfWeekCounts,
    hourlyCounts,
    yearCounts,
  };
}
