"use client";

export default function GamesError({ reset }: { reset: () => void }) {
  return (
    <section className="games-source-error" role="alert">
      <p className="games-kicker">Games data unavailable</p>
      <h1>Could not read the Games sheet</h1>
      <p>Check the configured tab names and Google Sheets credentials, then try again.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  );
}
