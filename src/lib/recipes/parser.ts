import type { MealIdea, RecipeCategory, RecipeLibrary } from "./types";

export type RecipeBlock = {
  style: string | null;
  text: string;
};

const categories = new Set<RecipeCategory>(["Main", "Snacks & Sides", "Sauces", "Desserts"]);

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function extractMarkers(text: string) {
  return {
    quick: text.includes("⏳"),
    maddyFavorite: text.includes("❤️"),
    workFriendly: text.includes("💼"),
  };
}

function extractParenthetical(text: string): string | null {
  const matches = [...text.matchAll(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
  return matches.length ? matches.join(" ") : null;
}

export function filterMealIdeas(
  ideas: readonly MealIdea[],
  options: {
    search?: string;
    category?: RecipeCategory | "All ideas";
    quick?: boolean;
    favorite?: boolean;
    work?: boolean;
    needsRecipe?: boolean;
    templates?: boolean;
  },
): MealIdea[] {
  const search = normalize(options.search ?? "");
  return ideas.filter((idea) => {
    if (options.category && options.category !== "All ideas" && idea.category !== options.category) return false;
    if (options.quick && !idea.quick) return false;
    if (options.favorite && !idea.maddyFavorite) return false;
    if (options.work && !idea.workFriendly) return false;
    if (options.needsRecipe && !idea.needsRecipe) return false;
    if (options.templates && !idea.template) return false;
    if (!search) return true;
    return normalize([idea.name, idea.category, idea.section ?? "", idea.note ?? ""].join(" ")).includes(search);
  });
}

export function chooseRandomMeal<T>(candidates: readonly T[], randomValue = Math.random()): T | null {
  if (candidates.length === 0) return null;
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("randomValue must be in the half-open interval [0, 1)");
  }
  return candidates[Math.floor(randomValue * candidates.length)];
}

export function parseRecipeDocument(title: string | null, blocks: readonly RecipeBlock[]): RecipeLibrary {
  const issues: string[] = [];
  const ideas: MealIdea[] = [];
  const seen = new Set<string>();
  let category: RecipeCategory = "Main";
  let section: string | null = null;
  let needsRecipe = false;
  let sourceNote: string | null = null;
  let sectionQuick = false;

  const sectionLabels = new Set([
    "chicken stuff", "crock pot", "pizzas", "sandwiches", "eggs", "meat concoctions",
    "mediterranean", "(non-egg) breakfast-y meals", "pasta", "fish", "rice & beans",
    "meatloaf", "nachos", "cloud bread", "vegetables", "fruit", "asian",
    "cookies", "need to create",
    "self-breaded chicken",
  ]);

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const raw = String(block.text ?? "").replace(/\r/g, "").trim();
    if (!raw) continue;

    if (block.style === "HEADING_1" && categories.has(raw as RecipeCategory)) {
      category = raw as RecipeCategory;
      section = null;
      needsRecipe = false;
      sectionQuick = false;
      continue;
    }

    if (/^Need to Create$/i.test(raw) && block.style === "HEADING_2") {
      needsRecipe = true;
      section = "Need to Create";
      sectionQuick = false;
      continue;
    }

    if (block.style === "HEADING_2") {
      section = raw.replace(/[⏳❤️💼]/g, "").trim() || null;
      needsRecipe = false;
      sectionQuick = raw.includes("⏳");
      continue;
    }

    if (/^[⏳❤️💼]\s*=/u.test(raw)) continue;
    if (/^No special recipe:/i.test(raw) || /^Some ideas below,/i.test(raw)) {
      sourceNote = raw;
      continue;
    }

    const normalizedText = normalize(raw);
    if (sectionLabels.has(normalizedText)) {
      section = raw.replace(/[⏳❤️💼]/g, "").replace(/[:：]\s*$/, "").trim();
      continue;
    }

    const markers = extractMarkers(raw);
    const parenthetical = extractParenthetical(raw);
    const needsMarkersRemoved = raw.replace(/[⏳❤️💼]/gu, "").replace(/\s{2,}/g, " ").trim();
    const name = needsMarkersRemoved
      .replace(/\s*\([^)]*\)\s*$/, "")
      .replace(/\s*[—-]\s*[^—-]+$/, "")
      .replace(/[,:;]\s*$/, "")
      .trim();

    if (!name || /^\p{P}$/u.test(name)) continue;
    const idKey = normalize(name);
    if (seen.has(idKey)) continue;
    seen.add(idKey);

    const template = /\btemplate\b/i.test(raw) || /\bSome ideas below\b/i.test(raw) || /\bNeed to Create\b/i.test(raw);
    const note = [
      parenthetical,
      sourceNote,
    ].filter((value, index, values) => value && values.indexOf(value) === index).join(" — ") || null;
    sourceNote = null;

    ideas.push({
      id: `meal-${category}-${idKey}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLocaleLowerCase(),
      name,
      category,
      section,
      ...markers,
      quick: markers.quick || sectionQuick,
      needsRecipe,
      template,
      note,
      sourceBlock: index + 1,
    });
  }

  if (!blocks.some((block) => block.style === "HEADING_1" && categories.has(block.text.trim() as RecipeCategory))) {
    issues.push("No recipe category headings were found.");
  }

  const counts = {
    Main: ideas.filter((idea) => idea.category === "Main").length,
    "Snacks & Sides": ideas.filter((idea) => idea.category === "Snacks & Sides").length,
    Sauces: ideas.filter((idea) => idea.category === "Sauces").length,
    Desserts: ideas.filter((idea) => idea.category === "Desserts").length,
  };

  return { title: title?.trim() || "Recipes & meal ideas", ideas, counts, issues };
}
