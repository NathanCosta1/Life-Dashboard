export type GoiIssue = {
  source: "games-goi";
  rowNumber: number;
  field: string;
  message: string;
};

export type GoiBatchSummary = {
  count: number;
  fastestSeconds: number | null;
  slowestSeconds: number | null;
  averageSeconds: number | null;
  medianSeconds: number | null;
  standardDeviationSeconds: number | null;
  underTwoMinutes: number | null;
  underOneMinuteFifty: number | null;
  overTwoMinutesThirty: number | null;
};

export type GoiBatch = {
  label: string;
  runs: number[];
  summary: GoiBatchSummary;
};

export type GoiExperimentLibrary = {
  title: string;
  sourceNote: string | null;
  batches: GoiBatch[];
  issues: GoiIssue[];
};
