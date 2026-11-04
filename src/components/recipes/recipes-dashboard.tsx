"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { chooseRandomMeal, filterMealIdeas } from "@/lib/recipes/parser";
import type { MealIdea, RecipeCategory, RecipeLibrary } from "@/lib/recipes/types";

const categories: Array<RecipeCategory | "All ideas"> = [
  "All ideas", "Main", "Snacks & Sides", "Sauces", "Desserts",
];

export function RecipesDashboard({ data }: { data: RecipeLibrary }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<RecipeCategory | "All ideas">("All ideas");
  const [quick, setQuick] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [work, setWork] = useState(false);
  const [needsRecipe, setNeedsRecipe] = useState(false);
  const [templates, setTemplates] = useState(false);
  const [selected, setSelected] = useState<MealIdea | null>(null);
  const [picked, setPicked] = useState<MealIdea | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const filtered = useMemo(() => filterMealIdeas(data.ideas, {
    search, category, quick, favorite, work, needsRecipe, templates,
  }), [data.ideas, search, category, quick, favorite, work, needsRecipe, templates]);

  const resetFilters = () => {
    setSearch("");
    setCategory("All ideas");
    setQuick(false);
    setFavorite(false);
    setWork(false);
    setNeedsRecipe(false);
    setTemplates(false);
  };

  const closeDetails = () => {
    dialogRef.current?.close();
    setSelected(null);
  };

  const openDetails = (idea: MealIdea) => {
    setSelected(idea);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const handleBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) closeDetails();
    };
    dialog?.addEventListener("click", handleBackdrop);
    return () => dialog?.removeEventListener("click", handleBackdrop);
  }, []);

  return (
    <div className="recipes-theme">
      <header className="recipes-header">
        <div>
          <Link className="recipes-back-link" href="/" aria-label="Back to Life Dashboard">
            <span aria-hidden="true">←</span> Dashboard
          </Link>
          <p className="recipes-kicker">Recipe index</p>
          <h1>Recipes &amp; meal ideas</h1>
        </div>
        <div className="recipes-picker" aria-live="polite">
          <p>{picked ? "Tonight's pick" : `${filtered.length} matching ideas`}</p>
          <strong>{picked?.name ?? "Pick something"}</strong>
          {picked?.note && <span>{picked.note}</span>}
          <button type="button" onClick={() => setPicked(chooseRandomMeal(filtered, Math.random()))} disabled={filtered.length === 0}>
            Pick from current filters
          </button>
        </div>
      </header>

      <section className="recipes-counts" aria-label="Category counts">
        {categories.slice(1).map((name) => (
          <button
            type="button"
            key={name}
            className={category === name ? "is-active" : ""}
            aria-pressed={category === name}
            onClick={() => setCategory(name)}
          >
            <strong>{data.counts[name as RecipeCategory]}</strong>
            <span>{name}</span>
          </button>
        ))}
      </section>

      <section className="recipes-controls">
        <label className="recipes-search">
          <span>Search ideas</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, category, section, or note" />
        </label>
        <div className="recipes-tabs" aria-label="Categories">
          {categories.map((name) => (
            <button type="button" key={name} className={category === name ? "is-active" : ""} aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className="recipes-filters" aria-label="Quick filters">
          {[
            ["Quick", quick, setQuick],
            ["Favorites", favorite, setFavorite],
            ["Work lunches", work, setWork],
            ["Needs a recipe", needsRecipe, setNeedsRecipe],
            ["Templates", templates, setTemplates],
          ].map(([label, active, setter]) => (
            <button
              type="button"
              key={String(label)}
              aria-pressed={Boolean(active)}
              className={active ? "is-active" : ""}
              onClick={() => {
                const update = setter as React.Dispatch<React.SetStateAction<boolean>>;
                update((value) => !value);
              }}
            >
              {String(label)}
            </button>
          ))}
          {(search || category !== "All ideas" || quick || favorite || work || needsRecipe || templates) && (
            <button type="button" className="recipes-reset" onClick={resetFilters}>Reset</button>
          )}
        </div>
      </section>

      <section className="recipes-grid" aria-live="polite">
        {filtered.map((idea, index) => (
          <article
            key={idea.id}
            tabIndex={0}
            role="button"
            className={`recipe-card recipe-card-${index % 3}`}
            onClick={() => openDetails(idea)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDetails(idea);
              }
            }}
          >
            <div className="recipe-card-meta">
              <span>{idea.category}</span>
              {idea.section && <span>{idea.section}</span>}
            </div>
            <h2>{idea.name}</h2>
            {idea.note && <p>{idea.note}</p>}
            <div className="recipe-markers">
              {idea.quick && <span aria-label="Quick option">⏳ Quick</span>}
              {idea.maddyFavorite && <span aria-label="Maddy favorite">❤️ Favorite</span>}
              {idea.workFriendly && <span aria-label="Work friendly">💼 Work</span>}
              {idea.needsRecipe && <span>Needs recipe details</span>}
              {idea.template && <span>Template</span>}
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="recipes-empty">
            <h2>No ideas match these filters.</h2>
            <button type="button" onClick={resetFilters}>Reset filters</button>
          </div>
        )}
      </section>

      <dialog
        ref={dialogRef}
        className="recipes-dialog"
        aria-labelledby="recipe-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          closeDetails();
        }}
      >
        {selected && (
          <div>
            <button type="button" className="recipes-dialog-close" aria-label="Close recipe details" onClick={closeDetails} autoFocus>Close</button>
            <p>{selected.category}{selected.section ? ` / ${selected.section}` : ""}</p>
            <h2 id="recipe-dialog-title">{selected.name}</h2>
            {selected.note && <p className="recipes-dialog-note">{selected.note}</p>}
            <div className="recipe-markers">
              {selected.quick && <span>⏳ Quick option</span>}
              {selected.maddyFavorite && <span>❤️ Maddy favorite</span>}
              {selected.workFriendly && <span>💼 Work friendly</span>}
              {selected.needsRecipe && <span>Needs recipe details</span>}
              {selected.template && <span>Template</span>}
            </div>
            <section className="recipes-dialog-details" aria-label="Details">
              <p>{selected.note ? "Notes recorded" : "No extra details recorded"}</p>
              {selected.note ? (
                <div className="recipes-dialog-note-block">{selected.note}</div>
              ) : (
                <p className="recipes-dialog-status">
                  This document is a meal index. It does not include ingredients or preparation steps for this idea.
                </p>
              )}
            </section>
          </div>
        )}
      </dialog>
    </div>
  );
}
