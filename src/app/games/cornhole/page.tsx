import type { Metadata } from "next";
import { CornholeDashboard } from "@/components/games/cornhole-dashboard";
import { loadCornholeLibrary } from "@/lib/games/cornhole/data";

export const metadata: Metadata = {
  title: "Cornhole | Games",
  description: "Cornhole and Airmail performance tracking.",
};

export default async function CornholePage() {
  const data = await loadCornholeLibrary();
  return <CornholeDashboard data={data} />;
}
