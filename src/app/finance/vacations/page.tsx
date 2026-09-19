import { VacationsDashboard } from "@/components/finance/vacations-dashboard";
import { buildVacationDashboardModel, loadVacationData } from "@/lib/finance";

export default async function VacationsPage() {
  const data = await loadVacationData();
  return <VacationsDashboard model={buildVacationDashboardModel(data)} />;
}
