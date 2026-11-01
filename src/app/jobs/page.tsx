import { CareerDashboard } from "@/components/jobs/career-dashboard";
import { loadCareerLibrary } from "@/lib/jobs/data";

export default async function JobsPage() {
  const data = await loadCareerLibrary();
  return <CareerDashboard data={data} />;
}
