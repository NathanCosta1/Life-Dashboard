"use client";

import Link from "next/link";
import { useState } from "react";
import type { BasketballLibrary } from "@/lib/fitness/basketball/types";

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

export function BasketballDashboard({ data }: { data: BasketballLibrary }) {
  const [selected, setSelected] = useState(data.drills[0]?.drill ?? "free-throws");
  const drill = data.drills.find((item) => item.drill === selected) ?? data.drills[0];

  return (
    <main className="basketball-page">
      <Link href="/fitness" className="basketball-back"><span aria-hidden="true">←</span> Fitness</Link>
      <header className="basketball-header">
        <div><p>Training record / shooting</p><h1>Basketball</h1></div>
        <div className="basketball-title-mark" aria-hidden="true"><span /></div>
      </header>
      <div className="basketball-drills" role="tablist" aria-label="Basketball drill">
        {data.drills.map((item) => (
          <button key={item.drill} type="button" role="tab" aria-selected={item.drill === selected} className={item.drill === selected ? "is-active" : ""} onClick={() => setSelected(item.drill)}>
            {item.label}<small>{item.sessionCount} sessions</small>
          </button>
        ))}
      </div>
      {drill && (
        <>
          <section className="basketball-scoreboard" aria-label={`${drill.label} summary`}>
            <article className="basketball-primary"><span>Weighted percentage</span><strong>{formatPercent(drill.weightedPercentage)}</strong></article>
            <article><span>Makes</span><strong>{drill.totalMakes.toLocaleString()}</strong></article>
            <article><span>Attempts</span><strong>{drill.totalAttempts.toLocaleString()}</strong></article>
            <article><span>Sessions</span><strong>{drill.sessionCount}</strong></article>
            <article><span>Last 10 weighted</span><strong>{formatPercent(drill.recentTenPercentage)}</strong></article>
          </section>
          <section className="basketball-trend" aria-label={`${drill.label} percentage history`}>
            <header><div><p>Session performance</p><h2>Shot percentage</h2></div>{drill.bestSession && <strong>Best: {drill.bestSession.percentage.toFixed(1)}%</strong>}</header>
            {drill.sessions.length < 2 ? (
              <div className="basketball-no-trend">Not enough sessions for a trend.</div>
            ) : (
              <div className="basketball-chart">
                {drill.sessions.slice(-30).map((session) => (
                  <div className="basketball-chart-point" key={`${session.sourceRowNumber}-${session.date}`} title={`${session.date ?? "Undated"}: ${session.percentage.toFixed(1)}%, ${session.makes}/${session.attempts}`}>
                    <span style={{ height: `${Math.max(8, session.percentage)}%` }} />
                    <small>{session.date?.slice(5) ?? "—"}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="basketball-ledger" aria-label={`${drill.label} session ledger`}>
            <header><p>Session ledger</p><span>{drill.sessions.length} valid records</span></header>
            {drill.sessions.slice().reverse().map((session) => (
              <article key={`${session.sourceRowNumber}-${session.date}`}>
                <time>{session.date ?? "Date not provided"}</time>
                <strong>{session.percentage.toFixed(1)}%</strong>
                <span>{session.makes} made</span><span>{session.attempts} attempts</span>
              </article>
            ))}
          </section>
        </>
      )}
      {data.issues.length > 0 && <section className="basketball-issues"><p>Source records needing review</p>{data.issues.map((issue) => <div key={`${issue.rowNumber}-${issue.field}`}>Row {issue.rowNumber}: {issue.message}</div>)}</section>}
    </main>
  );
}
