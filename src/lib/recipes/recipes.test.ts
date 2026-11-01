import { describe, expect, it } from "vitest";
import { chooseRandomMeal, filterMealIdeas, parseRecipeDocument, type RecipeBlock } from "./parser";

const documentBlocks: RecipeBlock[] = [
  { style: "NORMAL_TEXT", text: "⏳ = <~10 mins total" },
  { style: "HEADING_1", text: "Main" },
  { style: "NORMAL_TEXT", text: "Pizzas" },
  { style: "NORMAL_TEXT", text: "Pizza Bagel/Tortilla/English Muffin ⏳" },
  { style: "NORMAL_TEXT", text: "Nachos (air fry tortilla + ground meat + salsa)" },
  { style: "NORMAL_TEXT", text: "Taco Salad❤️" },
  { style: "HEADING_1", text: "Snacks & Sides" },
  { style: "HEADING_2", text: "Low Cook / No Cook ⏳" },
  { style: "NORMAL_TEXT", text: "Fruit" },
  { style: "NORMAL_TEXT", text: "Rice Cakes 💼" },
  { style: "HEADING_1", text: "Sauces" },
  { style: "HEADING_2", text: "Need to Create" },
  { style: "NORMAL_TEXT", text: "Garlic Yogurt “Aioli”" },
  { style: "HEADING_1", text: "Desserts" },
  { style: "NORMAL_TEXT", text: "Brownie Batter ❤️" },
  { style: "NORMAL_TEXT", text: "Chocolate Muffin ⏳" },
];

describe("parseRecipeDocument", () => {
  it("extracts markers and categories", () => {
    const library = parseRecipeDocument("Recipes / What to Eat?", documentBlocks);
    expect(library.ideas.find((idea) => idea.name === "Pizza Bagel/Tortilla/English Muffin")).toMatchObject({
      category: "Main",
      quick: true,
    });
    expect(library.ideas.find((idea) => idea.name === "Taco Salad")?.maddyFavorite).toBe(true);
    expect(library.ideas.find((idea) => idea.name === "Rice Cakes")?.workFriendly).toBe(true);
    expect(library.ideas.find((idea) => idea.name === "Brownie Batter")?.maddyFavorite).toBe(true);
  });

  it("extracts parenthetical notes and handles Need to Create", () => {
    const library = parseRecipeDocument("Recipes", documentBlocks);
    expect(library.ideas.find((idea) => idea.name === "Nachos")?.note).toContain("air fry tortilla");
    expect(library.ideas.find((idea) => idea.name === "Garlic Yogurt “Aioli”")).toMatchObject({
      needsRecipe: true,
      section: "Need to Create",
    });
  });

  it("handles headings-only and malformed content", () => {
    const library = parseRecipeDocument(null, [
      { style: "HEADING_1", text: "Main" },
      { style: "NORMAL_TEXT", text: "   " },
      { style: "NORMAL_TEXT", text: "" },
    ]);
    expect(library.title).toBe("Recipes & meal ideas");
    expect(library.ideas).toEqual([]);
    expect(library.counts.Main).toBe(0);
  });

  it("deduplicates titles case-insensitively", () => {
    const library = parseRecipeDocument("Recipes", [
      { style: "HEADING_1", text: "Main" },
      { style: "NORMAL_TEXT", text: "Taco" },
      { style: "NORMAL_TEXT", text: "taco" },
    ]);
    expect(library.ideas).toHaveLength(1);
  });

  it("identifies templates and quick items", () => {
    const library = parseRecipeDocument("Recipes", [
      { style: "HEADING_1", text: "Main" },
      { style: "NORMAL_TEXT", text: "Stir Fry Template (Some ideas below, included in recipes)" },
      { style: "NORMAL_TEXT", text: "Protein Oatmeal ⏳" },
    ]);
    expect(library.ideas.find((idea) => idea.name === "Stir Fry Template")?.template).toBe(true);
    expect(library.ideas.find((idea) => idea.name === "Protein Oatmeal")?.quick).toBe(true);
  });
});

describe("recipe filtering and random selection", () => {
  it("filters by search, category, and flags", () => {
    const library = parseRecipeDocument("Recipes", documentBlocks);
    expect(filterMealIdeas(library.ideas, { category: "Desserts", favorite: true }).map((idea) => idea.name)).toEqual(["Brownie Batter"]);
    expect(filterMealIdeas(library.ideas, { search: "air fry", category: "Main" }).map((idea) => idea.name)).toEqual(["Nachos"]);
    expect(filterMealIdeas(library.ideas, { quick: true })).toHaveLength(3);
    expect(filterMealIdeas(library.ideas, { needsRecipe: true })).toHaveLength(1);
  });

  it("returns random candidates and validates the random value", () => {
    expect(chooseRandomMeal(["a", "b", "c"], 0)).toBe("a");
    expect(chooseRandomMeal(["a", "b", "c"], 2 / 3)).toBe("c");
    expect(chooseRandomMeal([], 0)).toBeNull();
    expect(() => chooseRandomMeal(["a"], 1)).toThrow(RangeError);
  });
});
