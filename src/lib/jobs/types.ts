export type JobPayType = "hourly" | "salary" | null;

export type JobRecord = {
  id: string;
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  startPay: number | null;
  endPay: number | null;
  payType: JobPayType;
  bonuses: string | null;
  notes: string | null;
  sourceRow: number;
};

export type JobIssue = {
  source: "jobs";
  tab: string;
  rowNumber: number;
  field: string;
  message: string;
};

export type CareerLibrary = {
  jobs: JobRecord[];
  currentJobs: JobRecord[];
  completedJobs: JobRecord[];
  hourlyJobs: JobRecord[];
  salaryJobs: JobRecord[];
  uniqueCompanies: Array<{ company: string; count: number }>;
  issues: JobIssue[];
};
