import { describe, expect, it } from "vitest";
import { parseVaultLibrary } from "./parser";

describe("parseVaultLibrary", () => {
  it("normalizes year layouts, times, streaks, and repeated dates", () => {
    const data = parseVaultLibrary({
      2024: [
        ["DATE:", "MONTH", "DOW", "STREAK"],
        ["1/5/2024", "January", "Friday", "4"],
        ["bad", "January", "Friday", "9"],
      ],
      2025: [
        ["DATE:", "STREAK"],
        ["12/23/25", "0"],
        ["12/22/25", "32"],
      ],
      2026: [
        ["DATE:", "TIME:", "STREAK"],
        ["1/5/2026", "4:35 PM", "13"],
        ["1/5/2026", "4:35 PM", "13"],
        ["1/6/2026", "2:35 PM", "1"],
        ["1/7/2026", "bad", "0"],
      ],
    });

    expect(data.totalEvents).toBe(6);
    expect(data.events.find((event) => event.date === "2024-01-05")?.streak).toBe(4);
    expect(data.events.find((event) => event.date === "2026-01-05")?.time).toBe("4:35 PM");
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(32);
  });

  it("rejects invalid dates and malformed streak values", () => {
    const data = parseVaultLibrary({
      2025: [
        ["DATE:", "STREAK"],
        ["13/40/25", "4"],
        ["12/22/25", "many"],
        ["12/21/25", "-2"],
      ],
    });
    expect(data.events).toHaveLength(2);
    expect(data.events.every((event) => event.streak === null)).toBe(true);
    expect(data.totalEvents).toBe(2);
  });

  it("builds complete weekday and hourly distributions", () => {
    const data = parseVaultLibrary({
      2026: [
        ["DATE:", "TIME:", "STREAK"],
        ["1/5/2026", "12:00 AM", "1"],
        ["1/6/2026", "12:00 PM", "2"],
      ],
    });
    expect(data.dayOfWeekCounts).toHaveLength(7);
    expect(data.hourlyCounts).toHaveLength(24);
    expect(data.hourlyCounts[0].count).toBe(1);
    expect(data.hourlyCounts[12].count).toBe(1);
  });
});
