import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Random Games | Life Dashboard",
  description: "One-off gaming projects and experiments.",
};

export default function GamesRandomPage() {
  return (
    <div className="games-random-index">
      <Link href="/games" className="games-back-link"><span aria-hidden="true">←</span> Games directory</Link>
      <header className="games-random-header">
        <p>Random / 01</p>
        <h1>Random</h1>
      </header>
      <Link href="/games/random/goi-experiment" className="games-random-card">
        <span className="games-random-number">Random 01</span>
        <div>
          <p>200 consecutive runs</p>
          <h2>GOI Experiment</h2>
          <small>First 100 vs. second 100</small>
        </div>
        <strong aria-hidden="true">→</strong>
      </Link>
    </div>
  );
}
