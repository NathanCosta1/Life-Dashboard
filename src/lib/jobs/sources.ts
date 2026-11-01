export const jobsSource = {
  environmentVariable: "GOOGLE_SHEET_ID_JOBS",
  tab: "Sheet1",
  maxRows: 500,
  revalidateSeconds: 60 * 60,
} as const;

export function getJobsSpreadsheetId(): string {
  const spreadsheetId = process.env[jobsSource.environmentVariable];
  if (!spreadsheetId?.trim()) {
    throw new Error(`Missing ${jobsSource.environmentVariable}.`);
  }
  return spreadsheetId;
}
