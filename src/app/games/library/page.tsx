import type { Metadata } from "next";
import { GamesDashboard } from "@/components/games/games-dashboard";
import { loadGamesLibrary } from "@/lib/games/data";

export const metadata: Metadata = {
  title: "Game Library | Life Dashboard",
  description: "Game library, favorites, watchlist, and completed games.",
};

export default async function GamesLibraryPage() {
  const data = await loadGamesLibrary();
  return <GamesDashboard data={data} />;
}
