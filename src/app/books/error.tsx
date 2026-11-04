"use client";

import Link from "next/link";

export default function BooksError({ reset }: { reset: () => void }) {
  return (
    <section className="books-source-error" role="alert">
      <p className="books-kicker">Catalog unavailable</p>
      <h1>Could not load the catalog</h1>
      <p>Try loading this page again.</p>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/" className="books-back-link">← Life Dashboard</Link>
    </section>
  );
}
