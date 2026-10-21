export type FireOverviewScenario = {
  startingPortfolio: number;
  annualSpending: number;
  annualContributions: number;
  realReturnPercent: number;
  withdrawalRatePercent: number;
  contributionsGrow: boolean;
  yearsToRetirement: number;
  retirementPlanningEnabled: boolean;
  fiNumber: number;
  fireYear: number | null;
  fiProgress: number;
  retirementSupportsFi: boolean | null;
  retirementProjectionValue: number | null;
};

export const fireOverviewSystemPrompt = [
  "Write a casual, candid qualitative take in 1-2 short sentences, under 35 words, as one plain paragraph.",
  "Focus on the plan's greatest strength and biggest opportunity, or any assumption that seems unusually optimistic.",
  "Do not repeat dollar amounts, percentages, dates, or projection results; the user can already see those.",
  "Do not force a warning if the assumptions look ordinary. Use only the supplied facts, and do not give individualized financial advice.",
  "Return only the overview, with no preamble, headings, analysis, or instructions.",
  "Avoid generic disclaimers; mention uncertainty only when it is relevant to the scenario.",
].join(" ");

const scenarioKeys = [
  "startingPortfolio",
  "annualSpending",
  "annualContributions",
  "realReturnPercent",
  "withdrawalRatePercent",
  "contributionsGrow",
  "yearsToRetirement",
  "retirementPlanningEnabled",
  "fiNumber",
  "fireYear",
  "fiProgress",
  "retirementSupportsFi",
  "retirementProjectionValue",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberBetween(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function parseFireOverviewScenario(value: unknown): FireOverviewScenario | null {
  if (!isRecord(value) || Object.keys(value).length !== scenarioKeys.length) return null;
  if (!scenarioKeys.every((key) => Object.hasOwn(value, key))) return null;

  const fireYearValid = value.fireYear === null || isNumberBetween(value.fireYear, 1900, 2500);
  const retirementSupportValid = value.retirementSupportsFi === null || typeof value.retirementSupportsFi === "boolean";
  const retirementValueValid = value.retirementProjectionValue === null
    || isNumberBetween(value.retirementProjectionValue, 0, 1_000_000_000_000);

  if (
    !isNumberBetween(value.startingPortfolio, 0, 1_000_000_000_000)
    || !isNumberBetween(value.annualSpending, 0, 10_000_000_000)
    || !isNumberBetween(value.annualContributions, 0, 10_000_000_000)
    || !isNumberBetween(value.realReturnPercent, -99, 100)
    || !isNumberBetween(value.withdrawalRatePercent, 0.1, 20)
    || typeof value.contributionsGrow !== "boolean"
    || !isNumberBetween(value.yearsToRetirement, 0, 80)
    || !Number.isInteger(value.yearsToRetirement)
    || typeof value.retirementPlanningEnabled !== "boolean"
    || !isNumberBetween(value.fiNumber, 0, 1_000_000_000_000)
    || !fireYearValid
    || !isNumberBetween(value.fiProgress, 0, 1_000_000)
    || !retirementSupportValid
    || !retirementValueValid
  ) {
    return null;
  }

  return value as FireOverviewScenario;
}

export function buildFireOverviewPrompt(scenario: FireOverviewScenario): string {
  const retirement = scenario.retirementPlanningEnabled
    ? {
      yearsToRetirement: scenario.yearsToRetirement,
      reachesFiByRetirement: scenario.retirementSupportsFi,
      projectedPortfolioAtRetirement: scenario.retirementProjectionValue,
    }
    : null;
  const summary = {
    startingPortfolio: scenario.startingPortfolio,
    annualSpending: scenario.annualSpending,
    annualContributions: scenario.annualContributions,
    realReturnPercent: scenario.realReturnPercent,
    withdrawalRatePercent: scenario.withdrawalRatePercent,
    contributionsGrow: scenario.contributionsGrow,
    fiTarget: scenario.fiNumber,
    currentFiProgressPercent: Math.round(scenario.fiProgress * 1_000) / 10,
    projectedFiYear: scenario.fireYear,
    retirement,
  };

  return JSON.stringify(summary);
}

export function extractFireOverview(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.choices)) return null;
  const choice = value.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return null;
  if (typeof choice.message.content !== "string") return null;

  const raw = choice.message.content.trim();
  if (!raw || raw.length > 4_000) return null;
  if (/^(the user wants|i need to|let me analyze|let's analyze|we need to|here is my analysis)\b/i.test(raw)) return null;

  const normalized = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const segments = Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(normalized));
  const sentences = segments.slice(0, 2).map((segment) => segment.segment.trim()).filter(Boolean);
  const overview = sentences.join(" ");
  if (!overview || (choice.finish_reason === "length" && sentences.length === 0)) return null;
  return overview.length <= 500 ? overview : `${overview.slice(0, 497).trimEnd()}…`;
}
