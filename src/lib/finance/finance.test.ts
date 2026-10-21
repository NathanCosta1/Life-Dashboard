import { describe, expect, it } from "vitest";
import { parseCurrency } from "./parsers";
import { parseInvestmentTab } from "./investing";
import { buildVacationDashboardModel } from "./vacations-model";
import { parseVacationTab } from "./vacations";
import { parseHousingWorkbook } from "./housing";
import { calculateFire } from "./fire-model";
import { getProjectionLabelIndexes } from "./fire-model";
import { parseBudgetTab } from "./budget";
import {
  buildBudgetAllocations,
  buildBudgetBenefitEstimates,
  buildBudgetMetrics,
  calculateEmployerMatch,
  calculateEsppDiscountValue,
  defaultBudgetBenefitAssumptions,
  layoutBudgetFlowNodes,
} from "./budget-model";
import { buildFireOverviewPrompt, extractFireOverview, fireOverviewSystemPrompt, parseFireOverviewScenario } from "./fire-overview";

describe("finance parsers", () => {
  it("validates bounded AI overview scenarios and builds a minimal qualitative prompt", () => {
    const scenario = {
      startingPortfolio: 250000,
      annualSpending: 40000,
      annualContributions: 20000,
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      contributionsGrow: false,
      yearsToRetirement: 20,
      retirementPlanningEnabled: true,
      fiNumber: 1000000,
      fireYear: 2042,
      fiProgress: 0.25,
      retirementSupportsFi: true,
      retirementProjectionValue: 900000,
    };
    expect(parseFireOverviewScenario(scenario)).toEqual(scenario);
    expect(parseFireOverviewScenario({ ...scenario, annualSpending: Number.NaN })).toBeNull();
    expect(parseFireOverviewScenario({ ...scenario, birthday: "2003-07-25" })).toBeNull();
    const prompt = buildFireOverviewPrompt(scenario);
    expect(prompt).toContain('"annualSpending":40000');
    expect(prompt).toContain('"currentFiProgressPercent":25');
    expect(fireOverviewSystemPrompt).toContain("1-2 short sentences");
    expect(fireOverviewSystemPrompt).toContain("one plain paragraph");
    expect(fireOverviewSystemPrompt).toContain("Do not repeat dollar amounts");
    expect(prompt).not.toContain("birthday");
    expect(extractFireOverview({ choices: [{ finish_reason: "stop", message: { content: "A concise overview with one sentence is still useful." } }] })).not.toBeNull();
    expect(extractFireOverview({ choices: [{ finish_reason: "stop", message: { content: "The strongest signal is steady contributions relative to spending. The outcome still depends on the assumed return, so it is not guaranteed. Try lowering the real-return assumption to see how sensitive the target year is." } }] })).toContain("The strongest signal");
    expect(extractFireOverview({ choices: [{ finish_reason: "stop", message: { content: "One. Two. Three. Four. Five." } }] })).toBe("One. Two.");
    expect(extractFireOverview({ choices: [{ finish_reason: "length", message: { content: "A useful first sentence. A second complete thought before the token limit. Incomplete thought" } }] })).toBe("A useful first sentence. A second complete thought before the token limit.");
    expect(extractFireOverview({ choices: [{ finish_reason: "stop", message: { content: "The user wants a review. I need to identify..." } }] })).toBeNull();
  });

  it("accepts at least 80% of representative OpenRouter overview responses", () => {
    const samples = [
      "Your savings habit is doing the heavy lifting. The clearest opportunity is checking how a lower return changes the plan.",
      "The plan's strongest feature is the gap between income and spending; that gives contributions room to work. The return assumption is the main uncertainty.",
      "The strongest part is your consistent investing. Consider whether your spending target reflects the life you want.",
      "Your contribution pace is a real strength. Try a more conservative return assumption to see how much the timeline depends on it. These are estimates, not guarantees.",
      "The plan has a solid savings engine, though the growth assumption deserves a reality check.",
      "Your plan is relying heavily on investment growth rather than additional contributions.",
      "A strong savings rate gives this plan flexibility. The main opportunity is testing whether you could keep that pace through market downturns.",
      "**Strength:** steady contributions. **Opportunity:** test a lower real return.",
      "The user wants a qualitative review. I need to identify the strongest signal, the risk, and a sensitivity.",
      "",
    ];
    const accepted = samples.filter((content) => extractFireOverview({
      choices: [{ finish_reason: "stop", message: { content } }],
    }) !== null).length;

    expect(accepted / samples.length).toBeGreaterThanOrEqual(0.8);
  });

  it("parses Nathan Planned rows with clean display labels", () => {
    const result = parseBudgetTab([
      ["Nathan"], ["Per Biweekly Pay Period"], ["", "Taxes", "990"],
      ["", "401K*", "942.307692"], ["", "Fun / Savings****", "1018.846154"],
      ["", "Pay*****", "4730.769231"], ["Maddy"], ["", "Pay", "999"],
    ]);
    expect(result.data.every((line) => line.person === "Nathan")).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data.find((line) => line.label.startsWith("Fun"))?.label).toBe("Fun");
    expect(result.data.find((line) => line.label.startsWith("Fun"))?.ambiguous).toBeUndefined();
    expect(result.data.find((line) => line.label.startsWith("Pay"))?.annual).toBeCloseTo(122999.999, 2);
  });

  it("calculates budget metrics from normalized monthly values", () => {
    const lines = parseBudgetTab([["Nathan"], ["Per Biweekly Pay Period"], ["", "Taxes", "100"], ["", "Pay", "1000"], ["", "401K", "100"]]).data;
    const metrics = buildBudgetMetrics(buildBudgetAllocations(lines));
    expect(metrics.income).toBeCloseTo(2166.67, 1);
    expect(metrics.investing).toBeCloseTo(216.67, 1);
    expect(metrics.savingsRate).toBeCloseTo(0.1, 2);
  });

  it("maps source lines into broad editable budget categories", () => {
    const lines = parseBudgetTab([
      ["Nathan", "Per Biweekly Pay Period"],
      ["", "Taxes", "990"],
      ["", "401K* + match", "942.307692"],
      ["", "ESPP", "709.615385"],
      ["", "Car (Insurance + Maintenance)", "150"],
      ["", "Rent (utilities, fees, trash)", "920"],
      ["", "Fun / Savings", "1018.846154"],
      ["", "Pay", "4730.769231"],
    ]).data;
    const allocations = buildBudgetAllocations(lines);

    expect(allocations.investing).toBeCloseTo((942.307692 + 709.615385) * 26 / 12);
    expect(allocations.fun).toBeCloseTo(1018.846154 * 26 / 12);
    expect(allocations.savings).toBe(0);
    expect(allocations.living).toBeCloseTo(920 * 26 / 12);
    expect(allocations.car).toBeCloseTo(150 * 26 / 12);
    expect(allocations.groceries).toBe(0);
  });

  it("reports unallocated savings opportunities and over-allocation distinctly", () => {
    const underBudget = buildBudgetMetrics({
      income: 5000, taxes: 500, investing: 1000, fun: 500, savings: 300, living: 1500, car: 200, groceries: 400,
    });

    const overBudget = buildBudgetMetrics({
      income: 5000, taxes: 500, investing: 1000, fun: 1000, savings: 500, living: 2000, car: 300, groceries: 400,
    });
    expect(underBudget.freeToInvest).toBe(600);
    expect(overBudget.freeToInvest).toBe(-700);
    expect(buildBudgetMetrics({
      income: 1000, taxes: 100, investing: 100, fun: 200, savings: 100, living: 300, car: 100, groceries: 100.005,
    }).freeToInvest).toBe(0);
  });
  it("lays out Sankey destination cards without overlap, including zero-value categories", () => {
    const layout = layoutBudgetFlowNodes([
      { key: "taxes", amount: 2000 },
      { key: "investing", amount: 3000 },
      { key: "fun", amount: 2000 },
      { key: "savings", amount: 0 },
      { key: "living", amount: 1500 },
      { key: "car", amount: 500 },
      { key: "groceries", amount: 0 },
      { key: "unassigned", amount: 0 },
    ], 0.1);

    expect(layout).toHaveLength(8);
    expect(layout.every((node) => node.height >= 72)).toBe(true);
    expect(layout.every((node, index) => index === 0 || node.y >= layout[index - 1].y + layout[index - 1].height + 18)).toBe(true);
    expect(layout.filter((node) => node.bandHeight === 0)).toHaveLength(3);
  });
  it("estimates employer 401(k) match and ESPP discount from source contributions", () => {
    const lines = parseBudgetTab([
      ["Nathan", "Per Biweekly Pay Period"],
      ["", "401K*", "942.307692"],
      ["", "ESPP**", "709.615385"],
      ["", "Pay*****", "4730.769231"],
    ]).data;
    const estimates = buildBudgetBenefitEstimates(lines, defaultBudgetBenefitAssumptions);

    expect(estimates.eligibleAnnualPay).toBeCloseTo(123000, 0);
    expect(estimates.annualEmployee401k).toBeCloseTo(24500, 0);
    expect(estimates.annualEmployerMatch).toBeCloseTo(9225, 0);
    expect(estimates.annualEsppContribution).toBeCloseTo(18450, 0);
    expect(estimates.annualEsppDiscountValue).toBeCloseTo(3255.88, 0);
    expect(estimates.rothIraMaxed).toBe(true);
    expect(calculateEmployerMatch(100000, 1000, 7.5)).toBe(1000);
    expect(calculateEsppDiscountValue(10000, 0)).toBe(0);
  });
  it("parses currency formats and rejects malformed values", () => {
    expect(parseCurrency("$1,234.50")).toBe(1234.5);
    expect(parseCurrency("(42.00)")).toBe(-42);
    expect(parseCurrency("not money")).toBeNull();
  });

  it("separates investment starting contributions from monthly activity", () => {
    const result = parseInvestmentTab([
      ["Month", "Roth IRA", "Fidelity", "", "Total"],
      ["", "Starting Contributions", "Monthly Contributions", "Match", ""],
      ["September", "$30,000", "$1,000", "$100", "$1,100"],
    ], "2026");

    expect(result.data[0].startingBalances[0].amount).toBe(30000);
    expect(result.data[0].accounts.map((account) => account.amount)).toEqual([1000, 100]);
    expect(result.data[0].totalMatchesAccounts).toBe(true);
  });

  it("reports inconsistent investment totals", () => {
    const result = parseInvestmentTab([
      ["Month", "Fidelity", "Total"],
      ["", "Monthly Contributions", ""],
      ["September", "$1,000", "$900"],
    ], "2026");

    expect(result.data[0].totalMatchesAccounts).toBe(false);
  });

  it("normalizes vacation dates, totals, and duration", () => {
    const result = parseVacationTab([
      ["6/25/26 - 7/3/26 Mexico Cruise"],
      ["Expense", "Price"],
      ["Cruise", "2934.91"],
      ["Grand total", "2934.91"],
      ["Rough total per person (divide by 2)", "1467.455"],
    ], "Mexico Cruise");

    expect(result.data[0].year).toBe(2026);
    expect(result.data[0].durationDays).toBe(9);
    expect(result.data[0].total).toBe(2934.91);
    expect(result.data[0].perPersonTotal).toBe(1467.455);
  });

  it("builds vacation overview statistics", () => {
    const trips = [
      parseVacationTab([["1/1/24 - 1/3/24 Trip A"], ["Grand Total", "100"]], "Trip A").data[0],
      parseVacationTab([["1/1/25 - 1/5/25 Trip B"], ["Grand Total", "300"]], "Trip B").data[0],
    ];
    const model = buildVacationDashboardModel({ trips, issues: [] });

    expect(model.totals.tripCount).toBe(2);
    expect(model.totals.totalCost).toBe(400);
    expect(model.totals.longest?.name).toBe("Trip B");
  });

  it("separates housing sections and calculates missing monthly totals", () => {
    const result = parseHousingWorkbook([
      ["Move In"],
      ["Item", "Cost"],
      ["Deposit", "500"],
      ["Items"],
      ["Furniture", "1000"],
      ["Monthly"],
      ["Month", "Rent", "Electric", "Total"],
      ["August 2026", "1500", "100", ""],
    ]);

    expect(result.data[0].moveIn).toHaveLength(1);
    expect(result.data[0].items[0].value).toBe("1000");
    expect(result.data[0].monthly[0].total).toBe(1600);
  });

  it("calculates full FI and Coast FI milestones from editable assumptions", () => {
    const result = calculateFire({
      startingPortfolio: 250000,
      annualSpending: 40000,
      annualContributions: 20000,
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      yearsToRetirement: 20,
      retirementAge: 43,
    }, 2026);

    expect(result.fiNumber).toBe(1000000);
    expect(result.coastTarget).toBeCloseTo(376889.48, 1);
    expect(result.fiProgress).toBe(0.25);
    expect(result.supportedAnnualSpending).toBe(10000);
    expect(result.fireYear).toBe(2042);
    expect(result.milestones.find((milestone) => milestone.target === 500000)?.year).toBe(2033);
    expect(result.lowerProjection[1].portfolio).toBeLessThan(result.projection[1].portfolio);
    expect(result.upperProjection[1].portfolio).toBeGreaterThan(result.projection[1].portfolio);
    const growingContributions = calculateFire({
      startingPortfolio: 250000,
      annualSpending: 40000,
      annualContributions: 20000,
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      yearsToRetirement: 20,
      retirementAge: 43,
    }, 2026, 3);
    expect(growingContributions.fireYear).toBeLessThan(result.fireYear!);
    expect(result.coastProjection[1].portfolio).toBeGreaterThan(result.coastProjection[0].portfolio);
    const coastReachedIndex = result.coastProjection.findIndex((point, index) => (
      point.portfolio >= result.fiNumber / Math.pow(1.05, Math.max(0, 20 - index))
    ));
    expect(coastReachedIndex).toBeGreaterThan(0);
    expect(result.coastContributionProjection[coastReachedIndex + 1]?.portfolio).toBe(
      result.coastContributionProjection[coastReachedIndex]?.portfolio,
    );
    expect(result.coastRetirementSupportsFi).toBe(true);
    expect(result.retirementSupportsFi).toBe(true);
    expect(result.coastRetirementSupportedSpending).toBeGreaterThan(0);
    const reachedCoast = calculateFire({
      startingPortfolio: result.coastTarget,
      annualSpending: 40000,
      annualContributions: 20000,
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      yearsToRetirement: 20,
      retirementAge: 43,
    }, 2026);
    expect(reachedCoast.coastRetirementSupportsFi).toBe(true);
    expect(reachedCoast.coastReachedYear).toBe(2026);
    expect(reachedCoast.coastRetirementValue).toBeGreaterThanOrEqual(reachedCoast.fiNumber);
    expect(getProjectionLabelIndexes(26)).toEqual([0, 5, 10, 15, 20, 25]);
  });

  it("only stops Coast FI contributions after the portfolio can reach FI by retirement", () => {
    const result = calculateFire({
      startingPortfolio: 0,
      annualSpending: 40000,
      annualContributions: 10000,
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      yearsToRetirement: 20,
      retirementAge: 43,
    }, 2026);

    expect(result.coastReachedYear).toBeNull();
    expect(result.coastRetirementSupportsFi).toBe(false);
    expect(result.retirementSupportsFi).toBe(false);
    expect(result.coastContributionProjection[20].portfolio).toBe(200000);
  });

  it("marks FI as reached immediately when the portfolio is already at target", () => {
    const result = calculateFire({
      startingPortfolio: 1000000,
      annualSpending: 40000,
      annualContributions: 0,
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      yearsToRetirement: 20,
      retirementAge: 43,
    }, 2026);

    expect(result.fireYear).toBe(2026);
    expect(result.projection[0].portfolio).toBe(1000000);
  });

  it("parses only Nathan's biweekly budget block and normalizes it", () => {
    const result = parseBudgetTab([
      ["Nathan", "Per Biweekly Pay Period"],
      ["", "Taxes", "990"],
      ["", "401K*", "942.307692"],
      ["", "Car (Insurance + Maintenance)", "150"],
      ["", "Fun / Savings", "1018.846154"],
      ["", "Pay", "4730.769231"],
      ["Maddy", "Per Biweekly Pay Period"],
      ["", "Taxes", "482"],
    ]);

    expect(result.data).toHaveLength(5);
    expect(result.data.find((line) => line.label === "Taxes")?.frequency).toBe("biweekly");
    expect(result.data.find((line) => line.label === "Pay")?.monthly).toBeCloseTo(10250);
    expect(result.data.some((line) => line.amount === 482)).toBe(false);
    expect(result.data.find((line) => line.label === "Fun")?.ambiguous).toBeUndefined();
  });
});
