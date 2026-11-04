"use client";

import Link from "next/link";
import { useState } from "react";
import type { ScreenTimeLibrary, ScreenTimeSummary } from "@/lib/misc/screen-time/types";

function formatHours(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  const fixed = value.toFixed(digits);
  const [whole, decimal] = fixed.split(".");
  const commaWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return digits > 0 ? `${commaWhole}.${decimal}` : commaWhole;
}

function SummaryMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <article className={accent ? "screen-time-metric screen-time-metric-accent" : "screen-time-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ScreenTimeTrend({ summary }: { summary: ScreenTimeSummary }) {
  const records = summary.weeks
    .filter((week) => week.hoursSoFar !== null)
    .slice(-52);
  if (records.length < 2) {
    return <div className="screen-time-no-trend">Not enough weekly totals for a trend.</div>;
  }

  const values = records.flatMap((week) => [
    week.hoursSoFar as number,
    ...(week.onPaceHours === null ? [] : [week.onPaceHours]),
  ]);
  const max = Math.max(...values, summary.latestHours ?? 0);
  const width = 900;
  const height = 260;
  const left = 24;
  const right = 12;
  const top = 18;
  const bottom = 38;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const x = (index: number) => left + (records.length === 1 ? 0 : index / (records.length - 1) * innerWidth);
  const y = (value: number) => top + innerHeight - value / Math.max(max, 1) * innerHeight;
  const actualPoints = records.map((week, index) => `${x(index)},${y(week.hoursSoFar as number)}`).join(" ");
  const paceRecords = records.filter((week) => week.onPaceHours !== null);
  const pacePoints = paceRecords.map((week) => `${x(records.indexOf(week))},${y(week.onPaceHours as number)}`).join(" ");

  return (
    <div className="screen-time-chart-wrap">
      <svg className="screen-time-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${summary.owner} cumulative screen-time hours and average pace line`}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <g key={fraction}>
            <line x1={left} x2={width - right} y1={top + innerHeight * fraction} y2={top + innerHeight * fraction} />
            <text x={left} y={top + innerHeight * fraction - 4}>{formatHours(max * (1 - fraction), 0)}</text>
          </g>
        ))}
        <polyline className="screen-time-chart-pace" points={pacePoints} />
        <polyline className="screen-time-chart-actual" points={actualPoints} />
        {records.map((week, index) => (
          index % 5 === 0 || index === records.length - 1 ? <text key={week.sourceRowNumber} className="screen-time-chart-label" x={x(index)} y={height - 8}>{week.label.split(" ")[0]}</text> : null
        ))}
      </svg>
    </div>
  );
}

export function ScreenTimeDashboard({ data }: { data: ScreenTimeLibrary }) {
  const [selected, setSelected] = useState<"Nathan" | "Maddy">(data.people[0]?.owner ?? "Nathan");
  const summary = data.people.find((person) => person.owner === selected) ?? data.people[0];
  if (!summary) return null;
  const goalMeterWidth = summary.latestHours === null ? 0 : Math.min(100, summary.latestHours / data.goalHours * 100);
  const highest = summary.highestWeekAverage?.dailyAverageHours ?? null;
  const lowest = summary.lowestWeekAverage?.dailyAverageHours ?? null;

  return (
    <div className="screen-time-page">
      <Link href="/misc" className="screen-time-back"><span aria-hidden="true">←</span> MISC</Link>
      <header className="screen-time-header">
        <div>
          <p>Annual usage record / {data.year}</p>
          <h1>Screen Time</h1>
          <small className="screen-time-goal-copy">2026 goal: get under 1,000 hours</small>
        </div>
        <div className="screen-time-phone-mark" aria-hidden="true"><span /></div>
      </header>

      <div className="screen-time-owner-switch" role="tablist" aria-label="Screen Time owner">
        {data.people.map((person) => (
          <button
            key={person.owner}
            type="button"
            role="tab"
            aria-selected={person.owner === selected}
            className={person.owner === selected ? "is-active" : ""}
            onClick={() => setSelected(person.owner)}
          >
            {person.owner}<small>{person.weekCount} weeks</small>
          </button>
        ))}
      </div>

      <section className="screen-time-meter" aria-label={`${summary.owner} annual goal meter`}>
        <header>
          <p>{summary.owner} / recorded use</p>
          <strong>{formatHours(summary.latestHours)} <small>hours</small></strong>
        </header>
        <div className="screen-time-meter-track" aria-hidden="true">
          <span style={{ width: `${goalMeterWidth}%` }} />
          <i style={{ left: `${goalMeterWidth}%` }} />
        </div>
        <div className="screen-time-meter-scale">
          <span>0</span><strong>{formatHours(summary.remainingToGoal, 0)} hours to 1,000</strong><span>{data.goalHours}</span>
        </div>
      </section>

      <section className="screen-time-scoreboard" aria-label={`${summary.owner} summary`}>
        <SummaryMetric label="Average per day" value={`${formatHours(summary.averageDailyHours)} hr`} accent />
        <SummaryMetric label="Recent 4 weeks" value={`${formatHours(summary.recentFourWeekAverage)} hr`} />
        <SummaryMetric label="Highest week" value={`${formatHours(highest)} hr`} />
        <SummaryMetric label="Lowest week" value={`${formatHours(lowest)} hr`} />
        <SummaryMetric label="Pace difference" value={`${summary.paceDifference === null ? "—" : `${summary.paceDifference >= 0 ? "+" : ""}${formatHours(summary.paceDifference)} hr`}`} />
      </section>

      <section className="screen-time-trend" aria-label={`${summary.owner} cumulative hours trend`}>
        <header>
          <div><p>Cumulative record</p><h2>Hours through the year</h2></div>
          {summary.projectedAnnualHours !== null && (
            <strong>Current-rate view {formatHours(summary.projectedAnnualHours, 0)} hr</strong>
          )}
        </header>
        <ScreenTimeTrend summary={summary} />
      </section>

      <div className="screen-time-columns">
        <section className="screen-time-week-ledger" aria-label={`${summary.owner} weekly ledger`}>
          <header><p>Weekly ledger</p><span>{summary.weeks.length} valid records</span></header>
          {summary.weeks.slice().reverse().map((week) => (
            <article key={`${week.sourceRowNumber}-${week.label}`}>
              <div>
                <strong>{week.label}</strong>
                {week.imputed && <small>Imputed value</small>}
                {week.note && !week.imputed && <small>{week.note}</small>}
              </div>
              <div><span>Daily average</span><strong>{formatHours(week.dailyAverageHours)} hr</strong></div>
              <div><span>Hours so far</span><strong>{formatHours(week.hoursSoFar, 1)} hr</strong></div>
            </article>
          ))}
        </section>

        <section className="screen-time-extra-days" aria-label={`${summary.owner} extra days`}>
          <header><p>Extra days</p><span>Not in weekly totals</span></header>
          {summary.extraDays.length === 0 ? (
            <div className="screen-time-empty">No extra-day rows found.</div>
          ) : summary.extraDays.map((day) => (
            <article key={`${day.sourceRowNumber}-${day.label}`}>
              <time>{day.label}</time>
              <strong>{formatHours(day.hours)} hr</strong>
              {(day.note || day.imputed) &&               <small>{day.note ?? "Estimated value"}</small>}
            </article>
          ))}
        </section>
      </div>

      {data.issues.filter((issue) => issue.owner === summary.owner).length > 0 && (
        <section className="screen-time-issues">
          <p>Entries needing review</p>
          {data.issues.filter((issue) => issue.owner === summary.owner).map((issue) => (
            <div key={`${issue.rowNumber}-${issue.field}`}>{issue.message}</div>
          ))}
        </section>
      )}
    </div>
  );
}
