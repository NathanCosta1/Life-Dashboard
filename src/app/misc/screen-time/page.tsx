import type { Metadata } from "next";
import { ScreenTimeDashboard } from "@/components/misc/screen-time-dashboard";
import { loadScreenTimeLibrary } from "@/lib/misc/screen-time/data";

export const metadata: Metadata = {
  title: "Screen Time | MISC",
  description: "2026 Nathan and Maddy screen-time tracking.",
};

export default async function ScreenTimePage() {
  const data = await loadScreenTimeLibrary();
  return <ScreenTimeDashboard data={data} />;
}
