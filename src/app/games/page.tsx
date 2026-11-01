import type { Metadata } from "next";
import { GamesDirectory } from "@/components/games/games-directory";

export const metadata: Metadata = {
  title: "Games | Life Dashboard",
  description: "Gaming library and one-off random projects.",
};

export default function GamesPage() {
  return <GamesDirectory />;
}
