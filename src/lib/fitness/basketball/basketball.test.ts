import { describe, expect, it } from "vitest";
import { parseBasketballLibrary } from "./parser";

describe("parseBasketballLibrary", () => {
  it("keeps drills separate and calculates weighted totals", () => {
    const result = parseBasketballLibrary(
      [["Date", "Makes", "Attempts", "Percentages"], ["5/22/2026", "61", "98"], ["5/19/2026", "60", "100"]],
      [["Date", "Makes", "Attempts", "Percentages"], ["8/5/23", "8", "25"], ["8/3/23", "8", "25"]],
    );
    expect(result.drills[0].label).toBe("Free Throws");
    expect(result.drills[0].totalMakes).toBe(121);
    expect(result.drills[0].totalAttempts).toBe(198);
    expect(result.drills[0].weightedPercentage).toBeCloseTo(61.111, 3);
    expect(result.drills[1].weightedPercentage).toBe(32);
  });

  it("reports malformed rows and never treats missing attempts as a session", () => {
    const result = parseBasketballLibrary(
      [["Date", "Makes", "Attempts"], ["5/22/2026", "61", "0"], ["bad", "10", "20"], ["5/20/2026", "40", "50"]],
      [["Date", "Makes", "Attempts"]],
    );
    expect(result.drills[0].sessionCount).toBe(1);
    expect(result.drills[0].sessions[0].percentage).toBe(80);
    expect(result.drills[0].recentTenPercentage).toBe(80);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
