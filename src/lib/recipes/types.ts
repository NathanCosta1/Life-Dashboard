export type RecipeCategory = "Main" | "Snacks & Sides" | "Sauces" | "Desserts";

export type MealIdea = {
  id: string;
  name: string;
  category: RecipeCategory;
  section: string | null;
  quick: boolean;
  maddyFavorite: boolean;
  workFriendly: boolean;
  needsRecipe: boolean;
  template: boolean;
  note: string | null;
  sourceBlock: number;
};

export type RecipeLibrary = {
  title: string;
  ideas: MealIdea[];
  counts: Record<RecipeCategory, number>;
  issues: string[];
};

