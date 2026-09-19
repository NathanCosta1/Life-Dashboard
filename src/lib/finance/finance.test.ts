import { describe, expect, it } from "vitest";
import { parseCurrency } from "./parsers";
import { parseInvestmentTab } from "./investing";
import { buildVacationDashboardModel } from "./vacations-model";
import { parseVacationTab } from "./vacations";
import { parseHousingWorkbook } from "./housing";
import { calculateFire } from "./fire-model";
import { getProjectionLabelIndexes } from "./fire-model";

describe("finance parsers", () => {
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
});
