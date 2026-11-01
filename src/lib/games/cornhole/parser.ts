import type { CornholeDrillSummary, CornholeIssue, CornholeLibrary, CornholeSession } from "./types";

const parseDate = (raw: string): string | null => {
  const trimmed = raw.trim();
  const match = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/.exec(trimmed);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

function summarize(
  drill: CornholeDrillSummary["drill"],
  label: string,
  rows: readonly (readonly string[])[],
  issues: CornholeIssue[],
): CornholeDrillSummary {
  const sessions: CornholeSession[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const rawDate = String(row?.[0] ?? "").trim();
    const rawMakes = String(row?.[1] ?? "").trim();
    const rawAttempts = String(row?.[2] ?? "").trim();
    if (!rawDate && !rawMakes && !rawAttempts) continue;
    const makes = Number(rawMakes);
    const attempts = Number(rawAttempts);
    if (!rawDate || !rawMakes || !rawAttempts || !Number.isInteger(makes) || !Number.isInteger(attempts) || makes < 0 || attempts <= 0 || makes > attempts) {
      issues.push({
        source: "cornhole",
        rowNumber: index + 1,
        field: label,
        message: "Session has missing or implausible date, makes, or attempts.",
      });
      continue;
    }
    const date = parseDate(rawDate);
    if (!date) {
      issues.push({ source: "cornhole", rowNumber: index + 1, field: "Date", message: `Date "${rawDate}" could not be parsed.` });
      continue;
    }
    sessions.push({ date, makes, attempts, percentage: makes / attempts * 100, sourceRowNumber: index + 1 });
  }
  sessions.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.sourceRowNumber - b.sourceRowNumber);
  const totalMakes = sessions.reduce((sum, session) => sum + session.makes, 0);
  const totalAttempts = sessions.reduce((sum, session) => sum + session.attempts, 0);
  const recent = sessions.slice(-10);
  const recentMakes = recent.reduce((sum, session) => sum + session.makes, 0);
  const recentAttempts = recent.reduce((sum, session) => sum + session.attempts, 0);
  return {
    drill,
    label,
    sessions,
    sessionCount: sessions.length,
    totalMakes,
    totalAttempts,
    weightedPercentage: totalAttempts ? totalMakes / totalAttempts * 100 : null,
    averageSessionPercentage: sessions.length ? sessions.reduce((sum, session) => sum + session.percentage, 0) / sessions.length : null,
    recentTenPercentage: recentAttempts ? recentMakes / recentAttempts * 100 : null,
    bestSession: sessions.reduce<CornholeSession | null>((best, session) => !best || session.percentage > best.percentage ? session : best, null),
  };
}

export function parseCornholeLibrary(
  standard: readonly (readonly string[])[],
  airmail: readonly (readonly string[])[],
): CornholeLibrary {
  const issues: CornholeIssue[] = [];
  return {
    title: "Cornhole Tracking",
    drills: [
      summarize("standard", "Cornhole Makes", standard, issues),
      summarize("airmail", "Airmail Makes", airmail, issues),
    ],
    issues,
  };
}
