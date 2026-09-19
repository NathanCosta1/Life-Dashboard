import { CashFlowDashboard } from "@/components/finance/cash-flow-dashboard";
import { buildCashFlowDashboardModel, loadNetWorthData } from "@/lib/finance";

export default async function CashFlowPage() {
  const data = await loadNetWorthData();
  return <CashFlowDashboard model={buildCashFlowDashboardModel(data)} />;
}
