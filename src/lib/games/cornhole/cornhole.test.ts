import { describe, expect, it } from "vitest";
import { parseCornholeLibrary } from "./parser";

describe("parseCornholeLibrary", () => {
  it("calculates weighted standard-Cornhole and separate Airmail summaries", () => {
    const result = parseCornholeLibrary(
      [["Date", "Makes", "Attempts"], ["7/7/24", "44", "168"], ["5/9/23", "69", "160"]],
      [["Date", "Makes", "Attempts"], ["6/26/21", "21", "160"]],
    );
    expect(result.drills[0].totalMakes).toBe(113);
    expect(result.drills[0].totalAttempts).toBe(328);
    expect(result.drills[0].weightedPercentage).toBeCloseTo(34.451, 3);
    expect(result.drills[1].sessionCount).toBe(1);
    expect(result.drills[1].weightedPercentage).toBeCloseTo(13.125, 3);
  });

  it("ignores blank and summary-adjacent rows but diagnoses implausible sessions", () => {
    const result = parseCornholeLibrary(
      [["Date", "Makes", "Attempts"], [], ["5/20/22", "", ""], ["5/10/22", "30", "20"]],
      [["Date", "Makes", "Attempts"], ["", "", ""]],
    );
    expect(result.drills[0].sessionCount).toBe(0);
    expect(result.drills[1].sessionCount).toBe(0);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
