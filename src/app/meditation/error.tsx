"use client";

export default function MeditationError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="meditation-error">
      <p className="meditation-kicker">Practice could not be read</p>
      <h1>Stillness, interrupted</h1>
      <p>The Meditation sheet may be temporarily unavailable or its header layout may have changed.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
