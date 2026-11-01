import type { MeditationSession, TimeOfDay } from "./types";

export type MeditationParseIssue = {
  row: number;
  field: string;
  reason: string;
};

export type MeditationParseResult = {
  sessions: MeditationSession[];
  issues: MeditationParseIssue[];
};

const HEADER_NAMES = ["Date", "Start Time", "End Time", "Notes", "Duration", "Streak"];

export function parseMeditationDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(trimmed);
  if (iso) {
    const [, year, month, day] = iso;
    return validIso(year, month, day);
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(trimmed);
  if (slash) {
    const [, month, day, rawYear] = slash;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return validIso(year, month, day);
  }
  return null;
}

function validIso(year: string, month: string, day: string): string | null {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseMeditationDuration(value: string): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)\s*$/i.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

export function parseMeditationTime(value: string): number | null {
  const trimmed = value.trim();
  const meridiem = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(trimmed);
  if (meridiem) {
    let hour = Number(meridiem[1]) % 12;
    if (/PM/i.test(meridiem[3])) hour += 12;
    const minute = Number(meridiem[2]);
    return minute >= 60 ? null : hour + minute / 60;
  }
  const military = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!military) return null;
  const hour = Number(military[1]);
  const minute = Number(military[2]);
  return hour <= 23 && minute <= 59 ? hour + minute / 60 : null;
}

export function getTimeOfDay(hour: number | null): TimeOfDay | null {
  if (hour === null) return null;
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Midday";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

export function parseMeditationMatrix(matrix: string[][], year: number): MeditationParseResult {
  const issues: MeditationParseIssue[] = [];
  const headers = matrix[0]?.map((header) => header.trim()) ?? [];
  const expected = HEADER_NAMES.every((name, index) => headers[index] === name);
  if (!expected) {
    issues.push({ row: 1, field: "headers", reason: "Expected Date, Start Time, End Time, Notes, Duration, and Streak columns." });
    return { sessions: [], issues };
  }

  const sessions: MeditationSession[] = [];
  const identities = new Set<string>();
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const [rawDate, rawStart, rawEnd, rawNotes = "", rawDuration, rawStreak = ""] = row;
    if (!row.some((cell) => cell?.trim())) continue;

    const date = parseMeditationDate(rawDate ?? "");
    const duration = parseMeditationDuration(rawDuration ?? "");
    if (!date || !duration && duration !== 0) {
      issues.push({ row: index + 1, field: !date ? "Date" : "Duration", reason: "Invalid or missing value." });
      continue;
    }
    if (date.slice(0, 4) !== String(year)) continue;

    const startTime = (rawStart ?? "").trim();
    const startHour = parseMeditationTime(startTime);
    const streakNumber = Number.parseInt((rawStreak ?? "").trim(), 10);
    const session: MeditationSession = {
      sourceRow: index + 1,
      date,
      startTime,
      endTime: (rawEnd ?? "").trim(),
      durationMinutes: duration,
      streak: Number.isFinite(streakNumber) ? streakNumber : null,
      startHour,
      timeOfDay: getTimeOfDay(startHour),
      notes: rawNotes.trim() ? rawNotes.trim() : null,
    };

    const identity = JSON.stringify([
      session.date,
      session.startTime,
      session.endTime,
      session.durationMinutes,
      session.notes,
    ]);
    if (!identities.has(identity)) {
      identities.add(identity);
      sessions.push(session);
    }
  }
  return { sessions, issues };
}
