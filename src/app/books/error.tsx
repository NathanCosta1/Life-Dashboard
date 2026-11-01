"use client";

import Link from "next/link";

export default function BooksError({ reset }: { reset: () => void }) {
  return (
    <section className="books-source-error" role="alert">
      <p className="books-kicker">Catalog unavailable</p>
      <h1>Could not read the Books sheet</h1>
      <p>Check the configured tab name and Google Sheets credentials, then try again.</p>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/" className="books-back-link">← Life Dashboard</Link>
    </section>
  );
}
