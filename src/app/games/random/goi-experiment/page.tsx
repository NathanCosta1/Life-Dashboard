import type { Metadata } from "next";
import { GoiExperimentDashboard } from "@/components/games/goi-experiment-dashboard";
import { loadGoiExperiment } from "@/lib/games/random/goi-experiment/data";

export const metadata: Metadata = {
  title: "GOI Experiment | Games",
  description: "Getting Over It run-time comparison.",
};

export default async function GoiExperimentPage() {
  const data = await loadGoiExperiment();
  return <GoiExperimentDashboard data={data} />;
}
