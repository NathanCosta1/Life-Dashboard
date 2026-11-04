"use client";

export default function GamesError({ reset }: { reset: () => void }) {
  return (
    <section className="games-source-error" role="alert">
      <p className="games-kicker">Games data unavailable</p>
      <h1>Could not load Games</h1>
      <p>Try loading this page again.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  );
}
