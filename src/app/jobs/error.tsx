"use client";

import Link from "next/link";

export default function JobsError({ reset }: { reset: () => void }) {
  return (
    <section className="jobs-source-error" role="alert">
      <p className="jobs-kicker">Career register unavailable</p>
      <h1>Could not load the career record</h1>
      <p>Try loading this page again.</p>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/" className="jobs-back-link">← Life Dashboard</Link>
    </section>
  );
}
