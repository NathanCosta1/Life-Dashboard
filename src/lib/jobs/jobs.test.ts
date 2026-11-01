import { describe, expect, it } from "vitest";
import { parseJobsLibrary } from "./parser";

const headers = [
  "Company",
  "Title",
  "Start Date",
  "End Date",
  "Start Pay",
  "End Pay",
  "Salary (S)\nor Hourly (H)",
  "Bonuses",
  "Notes",
];

function row(values: Partial<Record<(typeof headers)[number], string>>): string[] {
  return headers.map((header) => values[header] ?? "");
}

describe("parseJobsLibrary", () => {
  it("parses hourly and salary roles while preserving current roles", () => {
    const result = parseJobsLibrary([
      headers,
      row({
        Company: "Example Co",
        Title: "Engineering Associate",
        "Start Date": "8/17/2026",
        "End Date": "",
        "Start Pay": "123000",
        "End Pay": "123000",
        "Salary (S)\nor Hourly (H)": "S",
        Bonuses: "25k Sign On",
        Notes: "Current role",
      }),
      row({
        Company: "Example Co",
        Title: "Engineering Intern",
        "Start Date": "6/2/2025",
        "End Date": "8/8/2025",
        "Start Pay": "57.21",
        "End Pay": "57.21",
        "Salary (S)\nor Hourly (H)": "H",
      }),
    ]);

    expect(result.jobs).toHaveLength(2);
    expect(result.currentJobs).toHaveLength(1);
    expect(result.completedJobs).toHaveLength(1);
    expect(result.hourlyJobs).toHaveLength(1);
    expect(result.salaryJobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({
      company: "Example Co",
      title: "Engineering Associate",
      startDate: "2026-08-17",
      endDate: null,
      isCurrent: true,
      startPay: 123000,
      payType: "salary",
    });
    expect(result.uniqueCompanies).toEqual([{ company: "Example Co", count: 2 }]);
  });

  it("rejects malformed dates and compensation values without inventing values", () => {
    const result = parseJobsLibrary([
      headers,
      row({
        Company: "Test Co",
        Title: "Invalid Role",
        "Start Date": "02/30/2025",
        "End Date": "not a date",
        "Start Pay": "unknown",
        "End Pay": "-10",
        "Salary (S)\nor Hourly (H)": "H",
      }),
    ]);

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({
      startDate: null,
      endDate: null,
      isCurrent: false,
      startPay: null,
      endPay: null,
    });
    expect(result.issues.map((issue) => issue.field)).toEqual([
      "Start Date",
      "End Date",
      "Start Pay",
      "End Pay",
    ]);
  });

  it("returns a structural diagnostic when required headers drift", () => {
    const result = parseJobsLibrary([["Company", "Unknown"], ["one", "two"]]);
    expect(result.jobs).toEqual([]);
    expect(result.issues[0]).toMatchObject({
      field: "headers",
      tab: "Sheet1",
    });
  });

  it("preserves source notes and trims line breaks for company and title display", () => {
    const result = parseJobsLibrary([
      headers,
      row({
        Company: " Capital One\n",
        Title: " Technology\n Development Intern ",
        "Start Date": "6/2/2025",
        "End Date": "",
        "Start Pay": "57.21",
        "End Pay": "57.21",
        "Salary (S)\nor Hourly (H)": "H",
        Notes: "20 hr / week\nduring school",
      }),
    ]);

    expect(result.jobs[0]).toMatchObject({
      company: "Capital One",
      title: "Technology Development Intern",
      notes: "20 hr / week\nduring school",
      bonuses: null,
    });
  });

  it("flags implausible salary and hourly magnitudes for source review", () => {
    const result = parseJobsLibrary([
      headers,
      row({
        Company: "Test Co",
        Title: "Salary role",
        "Start Date": "1/1/2026",
        "Salary (S)\nor Hourly (H)": "S",
        "Start Pay": "1230000",
      }),
      row({
        Company: "Test Co",
        Title: "Hourly role",
        "Start Date": "1/1/2025",
        "Salary (S)\nor Hourly (H)": "H",
        "Start Pay": "1250",
      }),
    ]);

    expect(result.issues.map((issue) => issue.field)).toEqual(["Salary", "Hourly pay"]);
  });
});
