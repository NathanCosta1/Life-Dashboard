"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { filterAndSortHikes } from "@/lib/hikes/parser";
import type { Hike, HikingLibrary } from "@/lib/hikes/types";

export function HikesDashboard({ data }: { data: HikingLibrary }) {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("All");
  const [state, setState] = useState("All");
  const [sort, setSort] = useState("newest");
  const [withPhoto, setWithPhoto] = useState(false);
  const [withNotes, setWithNotes] = useState(false);
  const [selected, setSelected] = useState<Hike | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const years = useMemo(
    () => [...new Set(data.hikes.map((hike) => hike.year).filter((value): value is number => value !== null))]
      .sort((a, b) => b - a),
    [data.hikes],
  );
  const states = useMemo(
    () => [...new Set(data.hikes.map((hike) => hike.state).filter((value): value is string => Boolean(value)))]
      .sort(),
    [data.hikes],
  );

  const filtered = useMemo(() => filterAndSortHikes(data.hikes, {
    search, year, state, withPhoto, withNotes, sort,
  }), [data.hikes, search, year, state, withPhoto, withNotes, sort]);

  const longest = [...data.hikes].filter((hike) => hike.lengthMiles !== null).sort((a, b) => (b.lengthMiles ?? 0) - (a.lengthMiles ?? 0))[0];
  const highest = [...data.hikes].filter((hike) => hike.heightFeet !== null).sort((a, b) => (b.heightFeet ?? 0) - (a.heightFeet ?? 0))[0];
  const mostRecent = data.hikes.reduce<Hike | null>((latest, hike) => !latest || hike.number > latest.number ? hike : latest, null);

  const yearMiles = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const hike of data.hikes) {
      if (hike.year && hike.lengthMiles !== null) totals[hike.year] = (totals[hike.year] ?? 0) + hike.lengthMiles;
    }
    return Object.entries(totals).map(([yearValue, miles]) => ({ year: Number(yearValue), miles }));
  }, [data.hikes]);
  const maxYearMiles = Math.max(...yearMiles.map((item) => item.miles), 1);
  const stateTotals = useMemo(() => {
    const totals = new Map<string, { hikes: number; miles: number }>();
    for (const hike of data.hikes) {
      if (!hike.state) continue;
      const current = totals.get(hike.state) ?? { hikes: 0, miles: 0 };
      totals.set(hike.state, {
        hikes: current.hikes + 1,
        miles: current.miles + (hike.lengthMiles ?? 0),
      });
    }
    return [...totals.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.hikes - a.hikes || b.miles - a.miles);
  }, [data.hikes]);
  const maxStateHikes = Math.max(...stateTotals.map((item) => item.hikes), 1);

  const resetFilters = () => {
    setSearch("");
    setYear("All");
    setState("All");
    setSort("newest");
    setWithPhoto(false);
    setWithNotes(false);
  };

  const closeDetails = () => {
    dialogRef.current?.close();
    setSelected(null);
  };

  const openDetails = (hike: Hike) => {
    setSelected(hike);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const handleBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) closeDetails();
    };
    dialog?.addEventListener("click", handleBackdrop);
    return () => dialog?.removeEventListener("click", handleBackdrop);
  }, []);

  const previous = selected ? data.hikes.find((hike) => hike.number === selected.number - 1) ?? null : null;
  const next = selected ? data.hikes.find((hike) => hike.number === selected.number + 1) ?? null : null;

  return (
    <div className="hikes-theme">
      <header className="hikes-header">
        <div>
          <Link className="hikes-back-link" href="/" aria-label="Back to Life Dashboard">
            <span aria-hidden="true">←</span> Dashboard
          </Link>
          <p className="hikes-kicker">Field journal / trail index</p>
          <h1>Hike journal</h1>
          <p className="hikes-subtitle">{data.hikes.length} recorded hikes</p>
        </div>
        <div className="hikes-mountain" role="img" aria-label="Layered mountain trail illustration">
          <div className="hikes-mountain-sun" />
          <svg viewBox="0 0 520 220" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <path className="hikes-mountain-far" d="M0 210 L95 112 L165 174 L250 54 L330 152 L405 82 L520 210 Z" />
            <path className="hikes-mountain-near" d="M0 220 L125 154 L205 188 L302 106 L390 174 L520 118 L520 220 Z" />
            <path className="hikes-trail" d="M250 216 C238 193 270 179 262 158 C254 137 282 126 294 106" />
            <circle cx="294" cy="106" r="5" />
          </svg>
          <span>{highest?.title ?? "Highest summit"}</span>
          <strong>{highest?.heightFeet ? `${highest.heightFeet.toLocaleString()} ft` : "Elevation"}</strong>
        </div>
      </header>

      <section className="hikes-metrics" aria-label="Hiking summary">
        <article><strong>{data.hikes.length}</strong><span>Recorded hikes</span></article>
        <article><strong>{data.totalLengthMiles.toFixed(1)} mi</strong><span>Total recorded distance</span></article>
        <article><strong>{data.totalElevationGainFeet.toLocaleString()} ft</strong><span>Total recorded gain</span></article>
        <article><strong>{mostRecent?.title ?? "None recorded"}</strong><span>Latest hike</span></article>
      </section>

      <section className="hikes-states" aria-labelledby="hikes-states-title">
        <div className="hikes-states-heading">
          <p>Trail territory</p>
          <h2 id="hikes-states-title">State by state</h2>
        </div>
        <div className="hikes-state-ridges">
          {stateTotals.map((item) => (
            <button
              type="button"
              key={item.name}
              className={state === item.name ? "is-active" : ""}
              onClick={() => setState((current) => current === item.name ? "All" : item.name)}
              aria-pressed={state === item.name}
            >
              <span className="hikes-state-ridge" style={{ "--state-height": `${Math.max(18, item.hikes / maxStateHikes * 100)}%` } as React.CSSProperties}>
                <i />
              </span>
              <strong>{item.name}</strong>
              <small>{item.hikes} {item.hikes === 1 ? "hike" : "hikes"} · {Math.round(item.miles)} mi</small>
            </button>
          ))}
        </div>
      </section>

      <section className="hikes-profile" aria-label="Recorded miles by year">
        <div className="hikes-profile-heading">
          <div>
            <p>Recorded miles</p>
            <strong>Year profile</strong>
          </div>
          <span>Valid length fields only</span>
        </div>
        <div className="hikes-bars">
          {[...yearMiles].sort((a, b) => a.year - b.year).map((item) => (
            <div className="hikes-bar-column" key={item.year}>
              <span className="hikes-bar-value">{item.miles.toFixed(1)} mi</span>
              <div className="hikes-bar-track"><i style={{ height: `${Math.max(12, item.miles / maxYearMiles * 100)}%` }} /></div>
              <span>{item.year}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hikes-controls">
        <label className="hikes-search">
          <span>Search hikes</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Trail, location, date, or note" />
        </label>
        <label><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value)}><option>All</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>State / region</span><select value={state} onChange={(event) => setState(event.target.value)}><option>All</option>{states.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="longest">Longest distance</option><option value="elevation">Largest elevation gain</option><option value="time">Longest elapsed time</option></select></label>
        <div className="hikes-filter-buttons" aria-label="Hike filters">
          <button type="button" aria-pressed={withPhoto} className={withPhoto ? "is-active" : ""} onClick={() => setWithPhoto((value) => !value)}>Photo link</button>
          <button type="button" aria-pressed={withNotes} className={withNotes ? "is-active" : ""} onClick={() => setWithNotes((value) => !value)}>Has notes</button>
          {(search || year !== "All" || state !== "All" || sort !== "newest" || withPhoto || withNotes) && <button type="button" onClick={resetFilters}>Reset</button>}
        </div>
      </section>

      <section className="hikes-records" aria-label="Notable hikes">
        <button type="button" onClick={() => longest && openDetails(longest)} disabled={!longest}>
          <span>Longest recorded</span><strong>{longest?.title ?? "Not recorded"}</strong><small>{longest?.lengthMiles ? `${longest.lengthMiles} mi` : ""}</small>
        </button>
        <button type="button" onClick={() => highest && openDetails(highest)} disabled={!highest}>
          <span>Highest recorded height</span><strong>{highest?.title ?? "Not recorded"}</strong><small>{highest?.heightFeet ? `${highest.heightFeet.toLocaleString()} ft` : ""}</small>
        </button>
      </section>

      <section className="hikes-grid" aria-live="polite">
        {filtered.map((hike) => (
          <article key={hike.id} role="button" tabIndex={0} onClick={() => openDetails(hike)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails(hike); } }}>
            <div className="hikes-card-number">#{hike.number}</div>
            <p className="hikes-card-location">{hike.location ?? "Location not recorded"}{hike.date ? ` / ${hike.date}` : ""}</p>
            <h2>{hike.title}</h2>
            <div className="hikes-card-stats">
              <span><strong>{hike.lengthMiles !== null ? `${hike.lengthMiles} mi` : "Distance not recorded"}</strong></span>
              <span><strong>{hike.elevationGainFeet !== null ? `${hike.elevationGainFeet.toLocaleString()} ft gain` : "Gain not recorded"}</strong></span>
              <span><strong>{hike.elapsedText ?? "Time not recorded"}</strong></span>
            </div>
            {hike.notes[0] && <p className="hikes-card-note">{hike.notes.slice(0, 2).join(" ")}</p>}
            <div className="hikes-card-footer"><span>{hike.photoUrl ? "Photos recorded" : "No photo link recorded"}</span><span>View log</span></div>
          </article>
        ))}
        {!filtered.length && (
          <div className="hikes-empty"><h2>No hikes match these filters.</h2><button type="button" onClick={resetFilters}>Reset filters</button></div>
        )}
      </section>

      <dialog ref={dialogRef} className="hikes-dialog" aria-labelledby="hike-dialog-title" onCancel={(event) => { event.preventDefault(); closeDetails(); }}>
        {selected && (
          <div>
            <button type="button" className="hikes-dialog-close" aria-label="Close hike details" onClick={closeDetails}>Close</button>
            <p className="hikes-dialog-index">Hike #{selected.number}{selected.date ? ` / ${selected.date}` : ""}</p>
            <h2 id="hike-dialog-title">{selected.title}</h2>
            <p className="hikes-dialog-location">{selected.location ?? "Location not recorded"}</p>
            <div className="hikes-dialog-grid">
              <article><span>Distance</span><strong>{selected.lengthMiles !== null ? `${selected.lengthMiles} mi` : "Not recorded"}</strong></article>
              <article><span>Height</span><strong>{selected.heightFeet !== null ? `${selected.heightFeet.toLocaleString()} ft` : "Not recorded"}</strong></article>
              <article><span>Elevation gain</span><strong>{selected.elevationGainFeet !== null ? `${selected.elevationGainFeet.toLocaleString()} ft` : "Not recorded"}</strong></article>
              <article><span>Elapsed time</span><strong>{selected.elapsedText ?? "Not recorded"}</strong></article>
              <article><span>Calories</span><strong>{selected.calories !== null ? `${selected.calories}${selected.activeCalories !== null ? ` (${selected.activeCalories} active)` : ""}` : "Not recorded"}</strong></article>
              <article><span>Average</span><strong>{selected.averageText ?? "Not recorded"}</strong></article>
            </div>
            <div className="hikes-dialog-notes">
              {selected.notes.length ? selected.notes.map((note, index) => <p key={`${selected.id}-${index}`}>{note}</p>) : <p>No journal notes recorded.</p>}
            </div>
            {selected.photoUrl ? <a className="hikes-photo-link" href={selected.photoUrl} target="_blank" rel="noreferrer">Open photo link</a> : <p className="hikes-no-photo">No photo link recorded</p>}
            <div className="hikes-dialog-nav">
              <button type="button" disabled={!previous} onClick={() => previous && openDetails(previous)}>Previous log</button>
              <button type="button" disabled={!next} onClick={() => next && openDetails(next)}>Next log</button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
