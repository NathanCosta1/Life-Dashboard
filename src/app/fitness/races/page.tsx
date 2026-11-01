import type { Metadata } from "next";
import { RacesDashboard } from "@/components/fitness/races-dashboard";
import { loadRaceLibrary } from "@/lib/fitness/races/data";

export const metadata: Metadata = {
  title: "Races | Fitness",
  description: "Race archive, personal bests, results, and race-day records.",
};

export default async function RacesPage() {
  const data = await loadRaceLibrary();
  return <RacesDashboard data={data} />;
}
