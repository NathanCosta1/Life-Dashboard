"use client";

import Link from "next/link";

export default function MoviesError({ reset }: { reset: () => void }) {
  return (
    <main className="movies-error" role="alert">
      <p>The picture has stopped</p>
      <h1>Could not read the Movies sheet</h1>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/misc">← MISC</Link>
    </main>
  );
}
