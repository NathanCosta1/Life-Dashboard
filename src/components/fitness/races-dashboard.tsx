"use client";

import Link from "next/link";
import { useState } from "react";
import type { RaceDistance, RaceLibrary, RaceRecord } from "@/lib/fitness/races/types";

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function raceDateLabel(race: RaceRecord) {
  return race.dateLabel ?? "Date not recorded";
}

function getPrimaryResultSeconds(race: RaceRecord) {
  if (race.primaryTimeSeconds !== null) return race.primaryTimeSeconds;
  const ownerResult = race.people.find((person) =>
    person.name.trim().toLowerCase() === "me" || person.name.trim().toLowerCase() === "nathan"
  );
  if (ownerResult?.resultTimeSeconds !== null && ownerResult?.resultTimeSeconds !== undefined) {
    return ownerResult.resultTimeSeconds;
  }
  return race.people[0]?.resultTimeSeconds ?? null;
}

export function RacesDashboard({ data }: { data: RaceLibrary }) {
  const [distance, setDistance] = useState<RaceDistance | "all" | "unknown">("all");
  const visibleRaces = data.races
    .filter((race) => distance === "all" || (distance === "unknown" ? race.distance === null : race.distance === distance))
    .slice()
    .reverse();
  const distances: Array<{ value: RaceDistance | "all" | "unknown"; label: string }> = [
    { value: "all", label: "All" },
    { value: "5k", label: "5K" },
    { value: "10k", label: "10K" },
    { value: "half-marathon", label: "Half Marathon" },
    { value: "unknown", label: "Other" },
  ];
  const years = data.summary.racesByYear;
  const maxYearCount = Math.max(1, ...years.map((year) => year.count));

  return (
    <main className="races-page">
      <Link href="/fitness" className="races-back"><span aria-hidden="true">←</span> Fitness</Link>

      <header className="races-header">
        <div className="races-header-bib" aria-hidden="true"><span>RACE</span><strong>RUN</strong></div>
        <div>
          <p>Finish-line record / personal archive</p>
          <h1>Races</h1>
        </div>
        <div className="races-header-count">
          <span>Recorded</span>
          <strong>{String(data.summary.raceCount).padStart(2, "0")}</strong>
          <small>{years.length ? `${years[0].year}—${years.at(-1)?.year}` : "No dates"}</small>
        </div>
      </header>

      <section className="races-personal-bests" aria-label="Personal bests">
        <header><p>Finish board</p><span>Fastest elapsed time by distance</span></header>
        <div>
          {(["5k", "10k", "half-marathon"] as const).map((distanceValue) => {
            const best = data.summary.personalBests.find((item) => item.distance === distanceValue);
            return (
              <article key={distanceValue}>
                <span>{best?.label ?? (distanceValue === "5k" ? "5K" : distanceValue === "10k" ? "10K" : "Half Marathon")}</span>
                <strong>{formatDuration(best ? getPrimaryResultSeconds(best.race) : null)}</strong>
                <small>{best ? best.race.name : "No valid result"}</small>
                {best?.race.date && <time>{best.race.dateLabel}</time>}
              </article>
            );
          })}
        </div>
      </section>

      <div className="races-filter" role="group" aria-label="Filter races by distance">
        {distances.map((item) => (
          <button
            type="button"
            key={item.value}
            className={distance === item.value ? "is-active" : ""}
            aria-pressed={distance === item.value}
            onClick={() => setDistance(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="races-analytics">
        <section className="races-year-strip" aria-label="Race count by year">
          <header><p>Attendance by year</p><span>{data.summary.completedCount} completed</span></header>
          {years.length === 0 ? (
            <div className="races-empty">No dated race records.</div>
          ) : (
            <div className="races-year-bars">
              {years.map((year) => (
                <article key={year.year}>
                  <time>{year.year}</time>
                  <div aria-hidden="true"><i style={{ height: `${Math.max(12, year.count / maxYearCount * 100)}%` }} /></div>
                  <strong>{year.count}</strong>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="races-distance-tally" aria-label="Race distance distribution">
          <header><p>Distance tally</p><span>Source race names only</span></header>
          {data.summary.racesByDistance.map((item) => (
            <article key={item.name}>
              <span>{item.label}</span>
              <div aria-hidden="true"><i style={{ width: `${Math.max(8, item.count / data.summary.raceCount * 100)}%` }} /></div>
              <strong>{item.count}</strong>
            </article>
          ))}
        </section>
      </div>

      <section className="races-ledger" aria-label="Race results ledger">
        <header>
          <p>Race ledger</p>
          <span>{visibleRaces.length} {visibleRaces.length === 1 ? "record" : "records"}</span>
        </header>
        {visibleRaces.length === 0 ? (
          <div className="races-empty races-empty-wide">No races match this distance filter.</div>
        ) : visibleRaces.map((race) => (
          <article key={race.id} className={`races-record races-record-${race.status}`}>
            <div className="races-bib">
              <span>#{race.sourceRowNumber.toString().padStart(3, "0")}</span>
              <strong>{race.distanceLabel ?? "Other"}</strong>
            </div>
            <div className="races-record-main">
              <header>
                <div>
                  <small>{race.status === "upcoming" ? "Upcoming" : race.status === "completed" ? "Completed" : "Result not established"}</small>
                  <h2>{race.name}</h2>
                </div>
                <time>{raceDateLabel(race)}</time>
              </header>
              <div className="races-result-grid">
                <div><span>Finish</span><strong>{formatDuration(getPrimaryResultSeconds(race))}</strong></div>
                <div><span>Place</span><strong>{race.placeLabel ? race.placeLabel.split(/\n/)[0] : "—"}</strong></div>
                <div><span>Location</span><strong>{race.location ?? "Not recorded"}</strong></div>
              </div>
              <details>
                <summary>Race-day details</summary>
                <div className="races-details-grid">
                  {race.companionText && <p><span>Ran with</span>{race.companionText}</p>}
                  {race.goals && <p><span>Goals</span>{race.goals}</p>}
                  {race.training && <p><span>Training</span>{race.training}</p>}
                  {race.splits.length > 0 && <p><span>Splits</span>{race.splits.join(" · ")}</p>}
                  {race.watchStats && <p><span>Watch stats</span>{race.watchStats}</p>}
                  {race.courseConditions && <p><span>Course conditions</span>{race.courseConditions}</p>}
                  {race.weather && <p><span>Weather</span>{race.weather}</p>}
                  {race.amenities && <p><span>Amenities</span>{race.amenities}</p>}
                  {race.notes && <p><span>Notes</span>{race.notes}</p>}
                  {race.people.length > 0 && (
                    <p>
                      <span>Recorded people</span>
                      {race.people.map((person) => `${person.name}: ${person.resultTimeLabel ?? "—"}`).join(" · ")}
                    </p>
                  )}
                  {race.resultsUrl && <a href={race.resultsUrl} target="_blank" rel="noreferrer">Open results</a>}
                  {race.picturesUrl && <a href={race.picturesUrl} target="_blank" rel="noreferrer">Open pictures</a>}
                </div>
              </details>
            </div>
          </article>
        ))}
      </section>

      {data.issues.length > 0 && (
        <details className="races-issues">
          <summary>Source records needing review ({data.issues.length})</summary>
          <ul>
            {data.issues.map((issue, index) => (
              <li key={`${issue.rowNumber}-${issue.field}-${index}`}><strong>Row {issue.rowNumber} · {issue.field}</strong> {issue.message}</li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
