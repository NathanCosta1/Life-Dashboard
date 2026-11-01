"use client";

import Link from "next/link";

export default function JobsError({ reset }: { reset: () => void }) {
  return (
    <section className="jobs-source-error" role="alert">
      <p className="jobs-kicker">Career register unavailable</p>
      <h1>Could not read the Jobs sheet</h1>
      <p>Check the configured tab name and Google Sheets credentials, then try again.</p>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/" className="jobs-back-link">← Life Dashboard</Link>
    </section>
  );
}
