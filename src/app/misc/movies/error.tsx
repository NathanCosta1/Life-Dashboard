"use client";

import Link from "next/link";

export default function MoviesError({ reset }: { reset: () => void }) {
  return (
    <div className="movies-error" role="alert">
      <p>The picture has stopped</p>
      <h1>Could not read the movie archive</h1>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/misc">← MISC</Link>
    </div>
  );
}
