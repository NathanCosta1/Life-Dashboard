"use client";

export default function RecipesError({ reset }: { reset: () => void }) {
  return (
    <section className="recipes-source-error" role="alert">
      <p>Recipe ideas unavailable</p>
      <h1>The recipe ideas are unavailable.</h1>
      <p>Try again later.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  );
}
