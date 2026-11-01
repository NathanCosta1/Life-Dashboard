import { loadMeditationData } from "@/lib/meditation/data";
import { MeditationDashboard } from "@/components/meditation/meditation-dashboard";

export default async function MeditationPage() {
  const data = await loadMeditationData();
  return <MeditationDashboard data={data} />;
}
