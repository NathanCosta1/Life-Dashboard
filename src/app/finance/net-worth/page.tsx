import { NetWorthDashboard } from "@/components/finance/net-worth-dashboard";
import { buildNetWorthDashboardModel, loadNetWorthData } from "@/lib/finance";

export default async function NetWorthPage() {
  const data = await loadNetWorthData();
  return <NetWorthDashboard model={buildNetWorthDashboardModel(data)} />;
}
