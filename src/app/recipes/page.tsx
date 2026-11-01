import type { Metadata } from "next";
import { RecipesDashboard } from "@/components/recipes/recipes-dashboard";
import { loadRecipesLibrary } from "@/lib/recipes/data";
import "./recipes.css";

export const metadata: Metadata = {
  title: "Recipes & Meal Ideas | Life Dashboard",
  description: "Search and browse meal ideas, quick options, favorites, and work lunches.",
};

export default async function RecipesPage() {
  const data = await loadRecipesLibrary();
  return <RecipesDashboard data={data} />;
}
