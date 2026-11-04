"use client";

import Link from "next/link";

export default function RacesError({ reset }: { reset: () => void }) {
  return (
    <div className="races-error" role="alert">
      <p>Race archive unavailable</p>
      <h1>Could not read the race archive</h1>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/fitness">← Fitness</Link>
    </div>
  );
}
