"use client";

export default function HikesError({ reset }: { reset: () => void }) {
  return (
    <section className="hikes-source-error" role="alert">
      <p>Hike journal unavailable</p>
      <h1>The hike journal is unavailable.</h1>
      <p>Try again later.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  );
}
