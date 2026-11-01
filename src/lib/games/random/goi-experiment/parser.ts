import type { GoiBatch, GoiExperimentLibrary, GoiIssue } from "./types";

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(label: string, values: readonly number[]): GoiBatch {
  const sorted = [...values].sort((a, b) => a - b);
  const average = sorted.length
    ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length
    : null;
  const deviation = average !== null && sorted.length
    ? Math.sqrt(sorted.reduce((sum, value) => sum + (value - average) ** 2, 0) / sorted.length)
    : null;
  return {
    label,
    runs: [...values],
    summary: {
      count: values.length,
      fastestSeconds: sorted[0] ?? null,
      slowestSeconds: sorted.at(-1) ?? null,
      averageSeconds: average,
      medianSeconds: median(sorted),
      standardDeviationSeconds: deviation,
      underTwoMinutes: values.length ? values.filter((value) => value < 120).length : null,
      underOneMinuteFifty: values.length ? values.filter((value) => value < 110).length : null,
      overTwoMinutesThirty: values.length ? values.filter((value) => value > 150).length : null,
    },
  };
}

export function parseGoiExperiment(rows: readonly (readonly string[])[]): GoiExperimentLibrary {
  const issues: GoiIssue[] = [];
  const first: number[] = [];
  const second: number[] = [];

  if (!rows[0]?.[0]?.trim().toLocaleLowerCase().includes("first") ||
      !rows[0]?.[1]?.trim().toLocaleLowerCase().includes("second")) {
    issues.push({
      source: "games-goi",
      rowNumber: 1,
      field: "headers",
      message: "Expected First 100 Runs and Second 100 Runs headers were not found.",
    });
  }

  for (let index = 1; index < rows.length; index += 1) {
    for (const [column, target] of [[0, first], [1, second]] as const) {
      const raw = String(rows[index]?.[column] ?? "").trim();
      if (!raw) continue;
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) {
        target.push(value);
      } else {
        issues.push({
          source: "games-goi",
          rowNumber: index + 1,
          field: column === 0 ? "First 100 Runs" : "Second 100 Runs",
          message: "Run value is not a positive numeric number of seconds.",
        });
      }
    }
  }

  const sourceNote = String(rows[0]?.[3] ?? "").trim() || null;
  return {
    title: "GOI Experiment",
    sourceNote,
    batches: [
      summarize("First 100 Runs", first),
      summarize("Second 100 Runs", second),
    ],
    issues,
  };
}
