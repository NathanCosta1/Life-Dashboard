export const netWorthFixture = [
  ["BALANCE SHEET", "", "", "Year", "Net Worth"],
  ["Cash", "$1,000", "", "2024", "$10,000"],
  ["Investments", "$9,000", "", "2025", "$12,500"],
] as const;

export const investingFixture = [
  ["Month", "Vanguard Roth IRA", "", "Fidelity 401K", "Total", "Notes"],
  ["January", "$500", "", "$1,000", "$1,500", ""],
  ["February", "$500", "", "$1,000", "", "calculated total"],
  ["March", "", "", "", "", ""],
] as const;

export const emptyInvestingFixture = [
  ["Month", "Vanguard Roth IRA", "Total"],
] as const;

export const vacationFixture = [
  ["6/25/26 - 7/3/26 Navigator of the Seas Mexico Cruise"],
  ["Food", "$100"],
  ["Transit", "$250"],
] as const;

export const housingFixture = [
  ["Harbor Village Apartment FINANCES (Richmond, VA)"],
  ["Rent", "$1,500"],
  ["Utilities", "$150"],
] as const;

export const malformedCurrencyFixture = [
  ["Month", "Vanguard Roth IRA", "Total"],
  ["April", "not-a-currency", "$0"],
] as const;
