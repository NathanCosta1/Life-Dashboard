import { BudgetDashboard } from "@/components/finance/budget-dashboard";
import { loadBudgetData } from "@/lib/finance";

export default async function BudgetPage() {
  return <BudgetDashboard data={await loadBudgetData()} />;
}
