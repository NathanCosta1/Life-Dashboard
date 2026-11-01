"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DigitalGame, FavoriteOwner, GamesLibrary } from "@/lib/games/types";
import { chooseRandomGame } from "@/lib/games/parser";

type View = "digital" | "analog" | "watchlist" | "completed" | "disliked";

const ownerLabels: Record<FavoriteOwner, string> = {
  maddy: "Maddy",
  nathan: "Nathan",
  both: "Both",
  unknown: "Favorite",
};

function ownerLabel(game: DigitalGame): string | null {
  return game.favoriteOwner ? ownerLabels[game.favoriteOwner] : null;
}

export function GamesDashboard({ data }: { data: GamesLibrary }) {
  const [view, setView] = useState<View>("digital");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState<FavoriteOwner | "any">("any");
  const [pool, setPool] = useState<"all" | "digital" | "analog" | "favorites">("all");
  const [selected, setSelected] = useState<DigitalGame | GamesLibrary["analog"][number] | null>(null);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const candidates = useMemo(() => {
    const digital = pool === "analog"
      ? []
      : data.digital.filter((game) => pool !== "favorites" || game.favorite);
    const analog = pool === "digital" ? [] : data.analog;
    return [...digital.map((game) => ({ kind: "digital" as const, game })), ...analog.map((game) => ({ kind: "analog" as const, game }))];
  }, [data, pool]);

  const pickGame = () => {
    if (!candidates.length) return;
    setAnimating(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const result = chooseRandomGame(candidates, Math.random());
      if (result) setSelected(result.game);
      setAnimating(false);
    }, 650);
  };

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const digital = data.digital.filter((game) =>
    (!normalizedSearch || `${game.title} ${game.platformText} ${game.players}`.toLocaleLowerCase().includes(normalizedSearch)) &&
    (owner === "any" || game.favoriteOwner === owner),
  );
  const analog = data.analog.filter((game) =>
    !normalizedSearch || `${game.title} ${game.section} ${game.rules}`.toLocaleLowerCase().includes(normalizedSearch),
  );
  const watchlist = data.watchlist.filter((game) =>
    !normalizedSearch || `${game.title} ${game.players} ${game.notes}`.toLocaleLowerCase().includes(normalizedSearch),
  );

  const counts = [
    ["digital", "Digital games", data.digital.length],
    ["analog", "Analog games", data.analog.length],
    ["watchlist", "Watchlist", data.watchlist.length],
    ["completed", "Completed", data.completed.length],
    ["disliked", "Disliked", data.disliked.length],
  ] as const;

  return (
    <div>
      <Link href="/games" className="games-back-link"><span aria-hidden="true">←</span> Games directory</Link>
      <header className="games-header">
        <div>
          <p className="games-kicker">Game library</p>
          <h1>Games</h1>
        </div>
        <div className="games-pick-console" aria-live="polite">
          <div className="games-pick-screen" aria-busy={animating}>
            {selected ? (
              <>
                <span>Selected</span>
                <strong>{selected.title}</strong>
                {"favoriteOwner" in selected && selected.favoriteOwner && selected.favoriteOwner !== "unknown" && (
                  <small>{ownerLabel(selected as DigitalGame)} favorite</small>
                )}
              </>
            ) : (
              <>
                <span>Ready</span>
                <strong>{animating ? "Selecting..." : "Choose a game"}</strong>
              </>
            )}
          </div>
          <div className="games-pick-controls">
            <label>
              Pool
              <select value={pool} onChange={(event) => setPool(event.target.value as typeof pool)}>
                <option value="all">Digital + analog</option>
                <option value="digital">Digital only</option>
                <option value="analog">Analog only</option>
                <option value="favorites">Favorites only</option>
              </select>
            </label>
            <button type="button" className="games-pick-button" onClick={pickGame} disabled={animating || candidates.length === 0}>
              {selected ? "Pick again" : "Pick a game"}
            </button>
          </div>
        </div>
      </header>

      <section className="games-metrics" aria-label="Library summary">
        {counts.map(([key, label, count]) => (
          <button key={key} type="button" className={view === key ? "is-active" : ""} onClick={() => setView(key)}>
            <strong>{count}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <section className="games-browser">
        <div className="games-toolbar">
          <div className="games-tabs" role="tablist" aria-label="Game library views">
            {counts.map(([key, label]) => (
              <button type="button" role="tab" aria-selected={view === key} key={key} className={view === key ? "is-active" : ""} onClick={() => setView(key)}>
                {label}
              </button>
            ))}
          </div>
          <label className="games-search">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, platform, or player support" />
          </label>
          {view === "digital" && (
            <label className="games-owner-filter">
              <span>Favorite owner</span>
              <select value={owner} onChange={(event) => setOwner(event.target.value as FavoriteOwner | "any")}>
                <option value="any">Any</option>
                <option value="nathan">Nathan</option>
                <option value="maddy">Maddy</option>
                <option value="both">Both</option>
              </select>
            </label>
          )}
        </div>

        {view === "digital" && (
          <div className="games-table-wrap">
            <table className="games-table">
              <thead><tr><th>Title</th><th>Platform</th><th>Players</th><th>Favorite</th><th>Date / cost</th></tr></thead>
              <tbody>
                {digital.map((game) => (
                  <tr key={game.id}>
                    <td><strong>{game.title}</strong>{game.notes && <span className="games-note">{game.notes}</span>}</td>
                    <td>{game.platformText || "—"}</td>
                    <td>{game.players || "—"}</td>
                    <td>{game.favorite ? <><span aria-label={`${ownerLabel(game)} favorite`}>★</span> {ownerLabel(game)}</> : "—"}</td>
                    <td>{[game.dateOrPurchase, game.costText].filter(Boolean).join(" / ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {digital.length === 0 && <p className="games-empty">No digital games match these filters.</p>}
          </div>
        )}

        {view === "analog" && (
          <div className="games-analog-grid">
            {analog.map((game) => (
              <article key={game.id}>
                <span>{game.section}</span>
                <h2>{game.title}</h2>
                {game.rules && <p>{game.rules}</p>}
              </article>
            ))}
            {analog.length === 0 && <p className="games-empty">No analog games match the search.</p>}
          </div>
        )}

        {view === "watchlist" && (
          <div className="games-table-wrap">
            <table className="games-table">
              <thead><tr><th>Title</th><th>Price</th><th>Sale</th><th>Players</th><th>Status</th></tr></thead>
              <tbody>
                {watchlist.map((game) => (
                  <tr key={game.id}>
                    <td><strong>{game.title}</strong>{game.notes && <span className="games-note">{game.notes}</span>}</td>
                    <td>{game.priceText ? `$${game.priceText}` : "—"}</td>
                    <td>{game.saleNotification ? "Yes" : "No"}</td>
                    <td>{game.players || "—"}</td>
                    <td>{game.releaseStatus === "not-yet-released" ? "Not yet released" : "Available / unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {watchlist.length === 0 && <p className="games-empty">No watchlist games match the search.</p>}
          </div>
        )}

        {(view === "completed" || view === "disliked") && (
          <div className="games-list">
            {(view === "completed" ? data.completed.filter((game) => !normalizedSearch || `${game.title} ${game.notes}`.toLocaleLowerCase().includes(normalizedSearch)) : data.disliked.filter((game) => !normalizedSearch || `${game.title} ${game.reason}`.toLocaleLowerCase().includes(normalizedSearch))).map((game) => (
              <article key={game.id}>
                <strong>{game.title}</strong>
                {"dateFinished" in game ? <span>{game.dateFinished || "Date unknown"}{game.durationText ? ` · ${game.durationText}` : ""}</span> : <span>{game.reason || "No reason recorded"}</span>}
                {"notes" in game && game.notes && <p>{game.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
