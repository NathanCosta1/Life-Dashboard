import type { InvestmentData } from "./investing-data";
import type { NetWorthData } from "./net-worth-data";

export type FireInputs = {
  startingPortfolio: number;
  annualSpending: number;
  annualContributions: number;
  realReturnPercent: number;
  withdrawalRatePercent: number;
  yearsToRetirement: number;
  retirementAge: number;
};

export type FireProjectionPoint = {
  year: number;
  portfolio: number;
};

export type FireMilestone = {
  target: number;
  year: number | null;
};

export function getProjectionLabelIndexes(length: number, interval = 5) {
  return Array.from({ length }, (_, index) => index).filter((index) => index % interval === 0);
}

export type FireDashboardModel = {
  defaults: FireInputs;
  asOfYear: number;
  currentAge: number;
  sourceSummary: {
    portfolioYear: number | null;
    spendingYear: number | null;
    contributionYear: number | null;
  };
};

function latestValue<T extends { year: number }>(points: T[]): T | null {
  return [...points].sort((a, b) => b.year - a.year)[0] ?? null;
}

function annualizedContribution(data: InvestmentData): { value: number; year: number | null } {
  const populatedYears = [...new Set(data.months.map((month) => month.year))].sort((a, b) => b - a);
  const year = populatedYears[0] ?? null;
  if (year === null) return { value: 0, year: null };
  const months = data.months.filter((month) => month.year === year);
  const total = months.reduce((sum, month) => sum + month.total, 0);
  const activeMonths = months.filter((month) => month.accounts.length > 0).length;
  return { value: activeMonths > 0 ? (total / activeMonths) * 12 : 0, year };
}

export function buildFireDashboardModel(data: Pick<NetWorthData, "netWorth" | "expenses"> & { investments: InvestmentData }): FireDashboardModel {
  const latestPortfolio = latestValue(data.netWorth);
  const latestSpending = latestValue(data.expenses);
  const contribution = annualizedContribution(data.investments);
  const now = new Date();
  const birthDate = new Date(2003, 6, 25);
  let currentAge = now.getFullYear() - birthDate.getFullYear();
  const birthdayPassed = now.getMonth() > birthDate.getMonth()
    || (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!birthdayPassed) currentAge -= 1;

  return {
    asOfYear: now.getFullYear(),
    currentAge,
    defaults: {
      startingPortfolio: Math.max(0, latestPortfolio?.netWorth ?? 0),
      annualSpending: 40000,
      annualContributions: Math.max(0, contribution.value),
      realReturnPercent: 5,
      withdrawalRatePercent: 4,
      yearsToRetirement: 20,
      retirementAge: currentAge + 20,
    },
    sourceSummary: {
      portfolioYear: latestPortfolio?.year ?? null,
      spendingYear: latestSpending?.year ?? null,
      contributionYear: contribution.year,
    },
  };
}

export function calculateFire(
  inputs: FireInputs,
  currentYear = new Date().getFullYear(),
  contributionGrowthPercent = 0,
) {
  const portfolio = Math.max(0, inputs.startingPortfolio);
  const spending = Math.max(0, inputs.annualSpending);
  const contributions = Math.max(0, inputs.annualContributions);
  const realReturn = Math.max(-0.99, inputs.realReturnPercent / 100);
  const withdrawalRate = Math.max(0.001, inputs.withdrawalRatePercent / 100);
  const yearsToRetirement = Math.max(0, Math.round(inputs.yearsToRetirement));
  const fiNumber = spending / withdrawalRate;
  const coastTarget = fiNumber / Math.pow(1 + realReturn, yearsToRetirement);
  const buildProjection = (annualReturn: number, contributionGrowthPercent = 0) => {
    const points: FireProjectionPoint[] = [];
    let projectedPortfolio = portfolio;
    let yearlyContributions = contributions;
    for (let year = 0; year <= 50; year += 1) {
      if (year > 0) {
        projectedPortfolio = projectedPortfolio * (1 + annualReturn) + yearlyContributions;
        yearlyContributions *= 1 + contributionGrowthPercent / 100;
      }
      points.push({ year: currentYear + year, portfolio: projectedPortfolio });
    }
    return points;
  };
  const projection = buildProjection(realReturn, contributionGrowthPercent);
  const lowerProjection = buildProjection(Math.max(-0.99, realReturn - 0.02), contributionGrowthPercent);
  const upperProjection = buildProjection(realReturn + 0.02, contributionGrowthPercent);
  const coastProjection: FireProjectionPoint[] = [];
  const coastContributionProjection: FireProjectionPoint[] = [];
  let coastPortfolio = portfolio;
  let coastContributions = contributions;
  let cumulativeContributions = 0;
  let coastReached = coastPortfolio >= coastTarget;
  let coastReachedYear = coastReached ? currentYear : null;
  for (let year = 0; year <= 50; year += 1) {
    if (year > 0) {
      if (!coastReached) cumulativeContributions += coastContributions;
      coastPortfolio = coastPortfolio * (1 + realReturn) + (coastReached ? 0 : coastContributions);
      const remainingYears = Math.max(0, yearsToRetirement - year);
      const targetForRetirement = fiNumber / Math.pow(1 + realReturn, remainingYears);
      if (!coastReached && year <= yearsToRetirement && coastPortfolio >= targetForRetirement) {
        coastReached = true;
        coastReachedYear = currentYear + year;
      }
      coastContributions *= 1 + contributionGrowthPercent / 100;
    }
    coastProjection.push({ year: currentYear + year, portfolio: coastPortfolio });
    coastContributionProjection.push({ year: currentYear + year, portfolio: cumulativeContributions });
  }
  const yearForTarget = (target: number) => projection.find((point) => point.portfolio >= target)?.year ?? null;
  const fireYear = yearForTarget(fiNumber);
  const retirementProjectionValue = projection[yearsToRetirement]?.portfolio ?? projection.at(-1)!.portfolio;
  const coastRetirementValue = coastProjection[yearsToRetirement]?.portfolio ?? coastProjection.at(-1)!.portfolio;
  const milestones: FireMilestone[] = [100000, 500000, 1000000].map((target) => ({
    target,
    year: yearForTarget(target),
  }));

  return {
    fiNumber,
    coastTarget,
    fiProgress: fiNumber > 0 ? portfolio / fiNumber : 0,
    coastProgress: coastTarget > 0 ? portfolio / coastTarget : 0,
    supportedAnnualSpending: portfolio * withdrawalRate,
    fireYear,
    projection,
    lowerProjection,
    upperProjection,
    coastProjection,
    coastContributionProjection,
    coastReachedYear,
    coastRetirementValue,
    coastRetirementSupportsFi: coastReachedYear !== null && coastRetirementValue >= fiNumber,
    retirementProjectionValue,
    retirementSupportsFi: retirementProjectionValue >= fiNumber,
    coastRetirementSupportedSpending: coastRetirementValue * withdrawalRate,
    milestones,
  };
}
