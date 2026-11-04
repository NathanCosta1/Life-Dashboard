"use client";

export default function MeditationError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="meditation-error">
      <p className="meditation-kicker">Practice could not be read</p>
      <h1>Stillness, interrupted</h1>
      <p>The meditation practice could not be loaded. Try again in a moment.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
