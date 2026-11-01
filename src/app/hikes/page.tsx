import type { Metadata } from "next";
import { HikesDashboard } from "@/components/hikes/hikes-dashboard";
import { loadHikingLibrary } from "@/lib/hikes/data";
import "./hikes.css";

export const metadata: Metadata = {
  title: "Hikes | Life Dashboard",
  description: "Search hike history, distances, elevation, notes, and photo links.",
};

export default async function HikesPage() {
  const data = await loadHikingLibrary();
  return <HikesDashboard data={data} />;
}
