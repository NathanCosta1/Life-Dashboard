import { describe, expect, it } from "vitest";
import {
  buildMeditationDays,
  buildMeditationYearData,
} from "./model";
import {
  parseMeditationDate,
  parseMeditationDuration,
  parseMeditationMatrix,
  parseMeditationTime,
  getTimeOfDay,
} from "./parser";

describe("meditation parsing", () => {
  it("parses supported dates, durations, times, and time-of-day buckets", () => {
    expect(parseMeditationDate("1/5/2026")).toBe("2026-01-05");
    expect(parseMeditationDate("2026-01-05")).toBe("2026-01-05");
    expect(parseMeditationDate("2/30/2026")).toBeNull();
    expect(parseMeditationDuration("20 mins")).toBe(20);
    expect(parseMeditationDuration("bad")).toBeNull();
    expect(parseMeditationTime("8:30 AM")).toBe(8.5);
    expect(parseMeditationTime("9:15 PM")).toBe(21.25);
    expect(getTimeOfDay(7)).toBe("Morning");
    expect(getTimeOfDay(13)).toBe("Midday");
    expect(getTimeOfDay(18)).toBe("Evening");
    expect(getTimeOfDay(23)).toBe("Night");
  });

  it("parses sessions and deduplicates identical rows", () => {
    const result = parseMeditationMatrix([
      ["Date", "Start Time", "End Time", "Notes", "Duration", "Streak"],
      ["1/5/2026", "8:30 AM", "8:50 AM", "", "20 mins", "1"],
      ["1/5/2026", "8:30 AM", "8:50 AM", "", "20 mins", "1"],
      ["1/6/2026", "9:00 PM", "9:10 PM", "steady", "10 mins", "2"],
    ], 2026);
    expect(result.issues).toEqual([]);
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[1].timeOfDay).toBe("Night");
  });

  it("reports malformed headers and row fields without notes content", () => {
    expect(parseMeditationMatrix([["Wrong", "header"], ["1/5/2026", "bad"]], 2026).issues[0].field).toBe("headers");
    const result = parseMeditationMatrix([
      ["Date", "Start Time", "End Time", "Notes", "Duration", "Streak"],
      ["bad", "8:00 AM", "8:10 AM", "private note text", "bad", "1"],
    ], 2026);
    expect(result.sessions).toEqual([]);
    expect(result.issues[0].field).toBe("Date");
  });
});

describe("meditation aggregates", () => {
  const parsed = parseMeditationMatrix([
    ["Date", "Start Time", "End Time", "Notes", "Duration", "Streak"],
    ["1/1/2026", "8:00 AM", "8:20 AM", "", "20 mins", "1"],
    ["1/2/2026", "8:00 AM", "8:10 AM", "", "10 mins", "2"],
    ["1/4/2026", "9:00 PM", "9:30 PM", "", "30 mins", "1"],
  ], 2026);

  it("builds full-year days, streaks, totals, and active-day breakdowns", () => {
    const year = buildMeditationYearData("2026", 2026, parsed.sessions);
    expect(year.days).toHaveLength(365);
    expect(year.summary.totalSessions).toBe(3);
    expect(year.summary.totalMinutes).toBe(60);
    expect(year.summary.activeDays).toBe(3);
    expect(year.summary.longestStreak).toBe(2);
    expect(year.summary.longestSkippedStreak).toBe(361);
    expect(year.summary.longestSessionMinutes).toBe(30);
    expect(year.summary.longestDayMinutes).toBe(30);
    expect(year.summary.mostActiveMonth).toBe("January");
  });

  it("creates a daily aggregation with zero days between sessions", () => {
    const days = buildMeditationDays(parsed.sessions, 2026);
    expect(days[0].totalMinutes).toBe(20);
    expect(days[1].sessionCount).toBe(1);
    expect(days[2].sessionCount).toBe(0);
    expect(days[3].totalMinutes).toBe(30);
  });
});
