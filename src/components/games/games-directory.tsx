import Link from "next/link";
import { loadGamesLibrary } from "@/lib/games/data";

export async function GamesDirectory() {
  let libraryCount = 0;
  let libraryConnected = true;
  try {
    const library = await loadGamesLibrary();
    libraryCount = library.digital.length + library.analog.length;
  } catch {
    libraryConnected = false;
  }

  return (
    <main className="games-directory">
      <Link href="/" className="games-back-link"><span aria-hidden="true">←</span> Life Dashboard</Link>
      <header className="games-directory-header">
        <p>Gaming cabinet / directory</p>
        <h1>Games</h1>
      </header>
      <section className="games-directory-cabinet" aria-label="Games destinations">
        <Link href="/games/library" className="games-directory-library">
          <span className="games-directory-index">01</span>
          <div><p>Digital + analog collection</p><h2>Library</h2><small>{libraryConnected ? `${libraryCount} titles` : "Source unavailable"}</small></div>
          <strong aria-hidden="true">→</strong>
        </Link>
        <Link href="/games/cornhole" className="games-directory-cornhole">
          <span className="games-directory-index">02</span>
          <div><p>Throw tracking</p><h2>Cornhole</h2><small>Ongoing game record</small></div>
          <strong aria-hidden="true">→</strong>
        </Link>
        <Link href="/games/random" className="games-directory-random">
          <span className="games-directory-index">03</span>
          <div><p>One-off projects</p><h2>Random</h2><small>1 project</small></div>
          <strong aria-hidden="true">→</strong>
        </Link>
      </section>
      <footer className="games-directory-status">
        <span>Library: {libraryConnected ? "connected" : "unavailable"}</span>
        <span>Random: 1 project</span>
      </footer>
    </main>
  );
}
