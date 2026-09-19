import { InvestingDashboard } from "@/components/finance/investing-dashboard";
import { buildInvestmentDashboardModel, loadInvestmentData } from "@/lib/finance";

type InvestingPageProps = {
  searchParams: Promise<{ year?: string; view?: string }>;
};

export default async function InvestingPage({ searchParams }: InvestingPageProps) {
  const params = await searchParams;
  const data = await loadInvestmentData();
  const selectedYear = params.year ? Number(params.year) : undefined;
  const model = buildInvestmentDashboardModel(data, Number.isInteger(selectedYear) ? selectedYear : undefined);
  const emptyTabs = data.tabs.filter((tab) => tab.status === "empty").map((tab) => tab.title);

  return <InvestingDashboard model={model} emptyTabs={emptyTabs} />;
}
