import { describe, expect, it } from "vitest";
import { parseScreenTimeLibrary } from "./parser";

const headers = [["WEEK", "AVG", "GOAL < 1000 HOURS", "Hours so far", "Total for on pace", "", "Extra days not part of the weeks", "Value", "Note"]];

describe("parseScreenTimeLibrary", () => {
  it("keeps Nathan and Maddy separate with independent values", () => {
    const nathan = [
      ...headers,
      ["1/4 - 1/11", "2.916666667", "", "29.3", "30.1", "", "Jan 1", "2.3"],
      ["1/11 - 1/18", "4.1", "", "58.0", "49.3"],
    ];
    const maddy = [
      ...headers,
      ["1/4 - 1/11", "2.266666667", "", "25.1", "30.1", "", "Jan 1", "3.192208673", "<- (imputed mean)"],
      ["1/11 - 1/18", "2.46666667", "", "42.4", "49.3"],
    ];
    const result = parseScreenTimeLibrary(nathan, maddy);
    expect(result.people[0].owner).toBe("Nathan");
    expect(result.people[0].latestHours).toBe(58);
    expect(result.people[1].owner).toBe("Maddy");
    expect(result.people[1].latestHours).toBe(42.4);
    expect(result.people[1].extraDays[0].imputed).toBe(true);
  });

  it("preserves notes and reports malformed source rows without treating blanks as zero", () => {
    const result = parseScreenTimeLibrary(
      [
        ...headers,
        ["1/4 - 1/11", "bad", "(Imputed average week, phone changed)", "", "30.1"],
        ["1/11 - 1/18", "", "", "", ""],
      ],
      [["WEEK", "AVG"]],
    );
    expect(result.people[0].weeks).toHaveLength(2);
    expect(result.people[0].weeks[0].dailyAverageHours).toBeNull();
    expect(result.people[0].weeks[0].imputed).toBe(true);
    expect(result.people[0].latestHours).toBeNull();
    expect(result.people[0].projectedAnnualHours).toBeNull();
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("keeps extra days separate from weekly totals and recognizes source totals", () => {
    const result = parseScreenTimeLibrary(
      [
        ...headers,
        ["1/4 - 1/11", "3", "", "21", "19", "", "Jan 1", "2.3"],
        ["", "", "", "", "", "", "Total Hours", "808.95"],
      ],
      [["WEEK"]],
    );
    const nathan = result.people[0];
    expect(nathan.extraDays).toHaveLength(1);
    expect(nathan.extraDays[0].label).toBe("Jan 1");
    expect(nathan.extraDays[0].hours).toBe(2.3);
    expect(nathan.latestHours).toBe(21);
    expect(nathan.sourceTotalHours).toBe(808.95);
  });

  it("uses current-rate projection only with multiple valid cumulative values", () => {
    const result = parseScreenTimeLibrary(
      [
        ...headers,
        ["1/4 - 1/11", "2", "", "14", "19"],
        ["1/11 - 1/18", "3", "", "35", "38"],
      ],
      [["WEEK"]],
    );
    expect(result.people[0].projectedAnnualHours).toBeCloseTo(910);
  });
});
