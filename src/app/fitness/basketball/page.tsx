import type { Metadata } from "next";
import { BasketballDashboard } from "@/components/fitness/basketball-dashboard";
import { loadBasketballLibrary } from "@/lib/fitness/basketball/data";

export const metadata: Metadata = {
  title: "Basketball | Fitness",
  description: "Basketball shooting session tracking.",
};

export default async function BasketballPage() {
  const data = await loadBasketballLibrary();
  return <BasketballDashboard data={data} />;
}
