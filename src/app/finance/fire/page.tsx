import { FireDashboard } from "@/components/finance/fire-dashboard";
import { buildFireDashboardModel, loadInvestmentData, loadNetWorthData } from "@/lib/finance";

export default async function FirePage() {
  const [netWorth, investments] = await Promise.all([loadNetWorthData(), loadInvestmentData()]);
  return <FireDashboard model={buildFireDashboardModel({ ...netWorth, investments })} />;
}
