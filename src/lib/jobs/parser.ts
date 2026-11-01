import { jobsSource } from "./sources";
import type { CareerLibrary, JobIssue, JobRecord } from "./types";

function normalizeHeader(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => !String(cell ?? "").trim());
}

function parseDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, monthText, dayText, yearText] = match;
  const month = Number(monthText);
  const day = Number(dayText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${yearText}-${monthText.padStart(2, "0")}-${dayText.padStart(2, "0")}`;
}

function parsePay(value: string): number | null {
  const trimmed = value.trim().replace(/[$,\s]/g, "");
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function displaySourceHeaderAlias(header: string): string {
  return header.includes("Salary") ? "Salary (S) or Hourly (H)" : header;
}

export function parseJobsLibrary(rows: readonly (readonly string[])[]): CareerLibrary {
  const headerIndex = rows.slice(0, 20).findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return ["company", "title", "startdate", "startpay", "endpay"].every((name) =>
      headers.includes(name),
    ) && headers.some((header) => header.includes("salary") || header.includes("hourly"));
  });
  const issues: JobIssue[] = [];

  if (headerIndex === -1) {
    return {
      jobs: [],
      currentJobs: [],
      completedJobs: [],
      hourlyJobs: [],
      salaryJobs: [],
      uniqueCompanies: [],
      issues: [{
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: 1,
        field: "headers",
        message: "Expected company, role, date, pay, and compensation-type headers were not found.",
      }],
    };
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const column = (name: string) => headers.indexOf(normalizeHeader(name));
  const payTypeColumn = headers.findIndex((header) =>
    header.includes("salary") || header.includes("hourly"),
  );
  const columns = {
    company: column("Company"),
    title: column("Title"),
    startDate: column("Start Date"),
    endDate: column("End Date"),
    startPay: column("Start Pay"),
    endPay: column("End Pay"),
    payType: payTypeColumn,
    bonuses: column("Bonuses"),
    notes: column("Notes"),
  };
  const jobs: JobRecord[] = [];
  const seen = new Set<string>();

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (isBlankRow(row)) continue;
    const company = normalizeText(String(row[columns.company] ?? ""));
    const title = normalizeText(String(row[columns.title] ?? ""));
    if (!company || !title) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: !company ? "Company" : "Title",
        message: "Job row is missing its company or title.",
      });
      continue;
    }

    const rawStartDate = String(row[columns.startDate] ?? "");
    const rawEndDate = String(row[columns.endDate] ?? "");
    const startDate = parseDate(rawStartDate);
    const endDate = rawEndDate.trim() ? parseDate(rawEndDate) : null;
    if (rawStartDate.trim() && !startDate) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: "Start Date",
        message: "Start Date is not a valid MM/DD/YYYY date.",
      });
    }
    if (rawEndDate.trim() && !endDate) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: "End Date",
        message: "End Date is not a valid MM/DD/YYYY date.",
      });
    }

    const startPay = parsePay(String(row[columns.startPay] ?? ""));
    const endPay = parsePay(String(row[columns.endPay] ?? ""));
    if (String(row[columns.startPay] ?? "").trim() && startPay === null) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: "Start Pay",
        message: "Start Pay could not be parsed as a non-negative number.",
      });
    }
    if (String(row[columns.endPay] ?? "").trim() && endPay === null) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: "End Pay",
        message: "End Pay could not be parsed as a non-negative number.",
      });
    }

    const typeValue = normalizeHeader(String(row[columns.payType] ?? ""));
    const payType = typeValue.startsWith("h")
      ? "hourly"
      : typeValue.startsWith("s")
        ? "salary"
        : null;
    if (!payType) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: displaySourceHeaderAlias(String(rows[headerIndex][columns.payType] ?? "")),
        message: "Compensation type is missing or unsupported.",
      });
    }
    if (payType === "salary" && [startPay, endPay].some((pay) => pay !== null && pay > 500_000)) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: "Salary",
        message: "Salary pay appears unusually high; verify that no extra zero or incorrect unit was entered.",
      });
    }
    if (payType === "hourly" && [startPay, endPay].some((pay) => pay !== null && pay > 250)) {
      issues.push({
        source: "jobs",
        tab: jobsSource.tab,
        rowNumber: index + 1,
        field: "Hourly pay",
        message: "Hourly pay appears unusually high; verify that the unit and digits are correct.",
      });
    }

    const identity = `${normalizeText(company).toLocaleLowerCase()}\u0000${normalizeText(title).toLocaleLowerCase()}\u0000${startDate ?? rawStartDate.trim()}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    jobs.push({
      id: `job-${index + 1}`,
      company,
      title,
      startDate,
      endDate,
      isCurrent: Boolean(rawEndDate.trim() === ""),
      startPay,
      endPay,
      payType,
      bonuses: String(row[columns.bonuses] ?? "").trim() || null,
      notes: String(row[columns.notes] ?? "").trim() || null,
      sourceRow: index + 1,
    });
  }

  jobs.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "") || a.company.localeCompare(b.company));
  const currentJobs = jobs.filter((job) => job.isCurrent);
  const completedJobs = jobs.filter((job) => !job.isCurrent);
  const hourlyJobs = jobs.filter((job) => job.payType === "hourly");
  const salaryJobs = jobs.filter((job) => job.payType === "salary");
  const companyCounts = new Map<string, number>();
  for (const job of jobs) {
    const key = normalizeText(job.company).toLocaleLowerCase();
    companyCounts.set(key, (companyCounts.get(key) ?? 0) + 1);
  }
  const uniqueCompanies = [...companyCounts.entries()]
    .map(([key, count]) => ({
      company: jobs.find((job) => normalizeText(job.company).toLocaleLowerCase() === key)?.company ?? key,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));

  return {
    jobs,
    currentJobs,
    completedJobs,
    hourlyJobs,
    salaryJobs,
    uniqueCompanies,
    issues,
  };
}
