import { HousingDashboard } from "@/components/finance/housing-dashboard";
import { buildHousingDashboardModel, loadHousingData } from "@/lib/finance";

export default async function HousingPage() {
  const data = await loadHousingData();
  return <HousingDashboard model={buildHousingDashboardModel(data)} />;
}
