import { describe, expect, it } from "vitest";
import { parseGoiExperiment } from "./parser";

describe("parseGoiExperiment", () => {
  it("parses two run batches and derives summary statistics", () => {
    const result = parseGoiExperiment([
      ["First 100 Runs", "Second 100 Runs", "", "I did not reset for 200 runs."],
      ["100.500", "80.000"],
      ["120.250", "90.000"],
      ["bad", ""],
      ["140.750", "110.000"],
    ]);

    expect(result.sourceNote).toBe("I did not reset for 200 runs.");
    expect(result.batches[0].runs).toEqual([100.5, 120.25, 140.75]);
    expect(result.batches[1].runs).toEqual([80, 90, 110]);
    expect(result.batches[0].summary.averageSeconds).toBeCloseTo(120.5);
    expect(result.batches[0].summary.medianSeconds).toBe(120.25);
    expect(result.batches[0].summary.fastestSeconds).toBe(100.5);
    expect(result.batches[1].summary.standardDeviationSeconds).toBeCloseTo(12.472, 3);
    expect(result.issues).toEqual([
      expect.objectContaining({ rowNumber: 4, field: "First 100 Runs" }),
    ]);
  });

  it("preserves missing values without treating them as zero", () => {
    const result = parseGoiExperiment([
      ["First 100 Runs", "Second 100 Runs"],
      ["", ""],
      ["0", "-1"],
    ]);

    expect(result.batches[0].summary.count).toBe(0);
    expect(result.batches[1].summary.count).toBe(0);
    expect(result.batches[0].summary.averageSeconds).toBeNull();
    expect(result.batches[0].runs).toEqual([]);
    expect(result.issues).toHaveLength(2);
  });
});
