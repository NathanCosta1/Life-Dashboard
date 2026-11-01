import Link from "next/link";

export default function FitnessPage() {
  return (
    <main className="basketball-page">
      <Link href="/" className="basketball-back"><span aria-hidden="true">←</span> Life Dashboard</Link>
      <section className="fitness-directory">
        <header className="basketball-header">
          <div><p>Training archive / directory</p><h1>Fitness</h1></div>
        </header>
        <Link href="/fitness/basketball" className="fitness-basketball-card">
          <span>01</span><div><p>Shot sessions</p><h2>Basketball</h2><small>Free Throws + Three Pointers</small></div><strong aria-hidden="true">→</strong>
        </Link>
        <Link href="/fitness/races" className="fitness-races-card">
          <span>02</span><div><p>Finish-line archive</p><h2>Races</h2><small>Results, times, and race-day notes</small></div><strong aria-hidden="true">→</strong>
        </Link>
      </section>
    </main>
  );
}
