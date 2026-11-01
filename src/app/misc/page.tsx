import Link from "next/link";

export default function MiscPage() {
  return (
    <main className="misc-index">
      <Link href="/" className="misc-back-link">
        <span aria-hidden="true">←</span> Life Dashboard
      </Link>
      <header className="misc-header">
        <p>Uncategorized / 01 collection</p>
        <h1>MISC</h1>
      </header>
      <section className="misc-subpages" aria-label="Miscellaneous pages">
        <Link href="/misc/secret" className="misc-subpage misc-subpage-secret">
          <span>01</span>
          <div>
            <p>Private page</p>
            <h2>Secret</h2>
          </div>
          <strong aria-hidden="true">→</strong>
        </Link>
        <Link href="/misc/screen-time" className="misc-subpage misc-subpage-screen-time">
          <span>02</span>
          <div>
            <p>Annual record</p>
            <h2>2026 Screen Time Tracking</h2>
          </div>
          <strong aria-hidden="true">→</strong>
        </Link>
        <Link href="/misc/movies" className="misc-subpage misc-subpage-movies">
          <span>03</span>
          <div>
            <p>Personal picture house</p>
            <h2>Movies</h2>
          </div>
          <strong aria-hidden="true">→</strong>
        </Link>
      </section>
    </main>
  );
}
