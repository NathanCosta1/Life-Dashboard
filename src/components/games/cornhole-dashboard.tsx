"use client";

import Link from "next/link";
import { useState } from "react";
import type { CornholeLibrary } from "@/lib/games/cornhole/types";

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

export function CornholeDashboard({ data }: { data: CornholeLibrary }) {
  const [selected, setSelected] = useState(data.drills[0]?.drill ?? "standard");
  const drill = data.drills.find((item) => item.drill === selected) ?? data.drills[0];

  return (
    <main className="cornhole-page">
      <Link href="/games" className="cornhole-back"><span aria-hidden="true">←</span> Games directory</Link>
      <header className="cornhole-header">
        <div><p>Game record / bags</p><h1>Cornhole</h1></div>
        <div className="cornhole-board-mark" aria-hidden="true"><i /><i /><i /></div>
      </header>
      <div className="cornhole-drills" role="tablist" aria-label="Cornhole drill">
        {data.drills.map((item) => (
          <button key={item.drill} type="button" role="tab" aria-selected={item.drill === selected} className={item.drill === selected ? "is-active" : ""} onClick={() => setSelected(item.drill)}>
            {item.label}<small>{item.sessionCount} sessions</small>
          </button>
        ))}
      </div>
      {drill && (
        <>
          <section className="cornhole-scoreboard" aria-label={`${drill.label} summary`}>
            <article className="cornhole-primary"><span>Weighted percentage</span><strong>{formatPercent(drill.weightedPercentage)}</strong></article>
            <article><span>Makes</span><strong>{drill.totalMakes.toLocaleString()}</strong></article>
            <article><span>Attempts</span><strong>{drill.totalAttempts.toLocaleString()}</strong></article>
            <article><span>Sessions</span><strong>{drill.sessionCount}</strong></article>
            <article><span>Last 10 weighted</span><strong>{formatPercent(drill.recentTenPercentage)}</strong></article>
          </section>
          <section className="cornhole-trend" aria-label={`${drill.label} percentage history`}>
            <header><div><p>Session performance</p><h2>Make percentage</h2></div>{drill.bestSession && <strong>Best: {drill.bestSession.percentage.toFixed(1)}%</strong>}</header>
            {drill.sessions.length < 2 ? (
              <div className="cornhole-no-trend">Not enough sessions for a trend.</div>
            ) : (
              <div className="cornhole-chart">
                {drill.sessions.slice().reverse().slice(-30).reverse().map((session) => (
                  <div className="cornhole-chart-point" key={`${session.sourceRowNumber}-${session.date}`} title={`${session.date ?? "Undated"}: ${session.percentage.toFixed(1)}%, ${session.makes}/${session.attempts}`}>
                    <span style={{ height: `${Math.max(8, session.percentage)}%` }} />
                    <small>{session.date?.slice(5) ?? "—"}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="cornhole-ledger" aria-label={`${drill.label} session ledger`}>
            <header><p>Throw ledger</p><span>{drill.sessions.length} valid records</span></header>
            {drill.sessions.slice().reverse().map((session) => (
              <article key={`${session.sourceRowNumber}-${session.date}`}>
                <time>{session.date ?? "Date not provided"}</time>
                <strong>{session.percentage.toFixed(1)}%</strong>
                <span>{session.makes} made</span><span>{session.attempts} throws</span>
              </article>
            ))}
          </section>
        </>
      )}
      {data.issues.length > 0 && <section className="cornhole-issues"><p>Source records needing review</p>{data.issues.map((issue) => <div key={`${issue.rowNumber}-${issue.field}`}>Row {issue.rowNumber}: {issue.message}</div>)}</section>}
    </main>
  );
}
