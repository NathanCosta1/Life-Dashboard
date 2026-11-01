import Link from "next/link";
import type { GoiBatch, GoiExperimentLibrary } from "@/lib/games/random/goi-experiment/types";

function formatTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(3).padStart(6, "0")}`;
}

function BatchSummary({ batch }: { batch: GoiBatch }) {
  const summary = batch.summary;
  return (
    <article className="goi-batch">
      <header><p>{batch.label}</p><strong>{summary.count} runs</strong></header>
      <dl>
        <div><dt>Fastest</dt><dd>{formatTime(summary.fastestSeconds)}</dd></div>
        <div><dt>Slowest</dt><dd>{formatTime(summary.slowestSeconds)}</dd></div>
        <div><dt>Average</dt><dd>{formatTime(summary.averageSeconds)}</dd></div>
        <div><dt>Median</dt><dd>{formatTime(summary.medianSeconds)}</dd></div>
        <div><dt>Std. deviation</dt><dd>{summary.standardDeviationSeconds === null ? "—" : `${summary.standardDeviationSeconds.toFixed(1)} sec`}</dd></div>
      </dl>
    </article>
  );
}

export function GoiExperimentDashboard({ data }: { data: GoiExperimentLibrary }) {
  const [first, second] = data.batches;
  const allRuns = data.batches.flatMap((batch) => batch.runs);
  const bucketSize = 30;
  const maxBucket = Math.max(1, ...Array.from({ length: 12 }, (_, index) => {
    const minimum = index * bucketSize;
    return allRuns.filter((run) => run >= minimum && run < minimum + bucketSize).length;
  }));
  const overallFastest = allRuns.length ? Math.min(...allRuns) : null;
  const overallAverage = allRuns.length ? allRuns.reduce((sum, run) => sum + run, 0) / allRuns.length : null;
  const underTwo = allRuns.filter((run) => run < 120).length;
  const overTwoThirty = allRuns.filter((run) => run > 150).length;

  return (
    <main className="goi-experiment">
      <nav className="goi-nav" aria-label="Breadcrumb">
        <Link href="/games/random" className="games-back-link"><span aria-hidden="true">←</span> Random</Link>
        <span>Games / Random 01</span>
      </nav>
      <header className="goi-header">
        <div><p>Run-time record / 200 consecutive runs</p><h1>GOI Experiment</h1></div>
        {data.sourceNote && <blockquote>{data.sourceNote}</blockquote>}
      </header>
      {data.issues.length > 0 && <section className="goi-issues" role="status">{data.issues.map((issue) => <p key={`${issue.rowNumber}-${issue.field}`}>Row {issue.rowNumber}: {issue.message}</p>)}</section>}
      <section className="goi-metrics" aria-label="Overall run summary">
        <article><span>Overall fastest</span><strong>{formatTime(overallFastest)}</strong></article>
        <article><span>Overall average</span><strong>{formatTime(overallAverage)}</strong></article>
        <article><span>Under 2:00</span><strong>{underTwo}</strong><small>runs</small></article>
        <article><span>Over 2:30</span><strong>{overTwoThirty}</strong><small>runs</small></article>
      </section>
      <section className="goi-batches" aria-label="Batch comparison">{first && <BatchSummary batch={first} />}{second && <BatchSummary batch={second} />}</section>
      <section className="goi-histogram" aria-label="Run-time histogram">
        <header><p>Run-time distribution</p><h2>30-second bands</h2></header>
        <div className="goi-buckets">
          {Array.from({ length: 12 }, (_, index) => {
            const minimum = index * bucketSize;
            const count = allRuns.filter((run) => run >= minimum && run < minimum + bucketSize).length;
            return <div key={minimum} title={`${formatTime(minimum)}–${formatTime(minimum + bucketSize)}: ${count} runs`}><span>{count}</span><i style={{ height: `${Math.max(4, count / maxBucket * 100)}%` }} /><small>{minimum / 60 < 10 ? `${minimum / 60}:00` : ""}</small></div>;
          })}
        </div>
      </section>
      <section className="goi-run-timeline" aria-label="Run timelines">
        {[first, second].map((batch) => batch && (
          <article key={batch.label}>
            <header><p>{batch.label}</p><span>{batch.runs.length} values</span></header>
            <div>{batch.runs.map((run, index) => <span key={`${batch.label}-${index}`} title={`Run ${index + 1}: ${formatTime(run)}`}><i style={{ opacity: 0.35 + Math.min(0.65, run / 240) }} /></span>)}</div>
          </article>
        ))}
      </section>
    </main>
  );
}
