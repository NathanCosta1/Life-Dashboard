"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CareerLibrary, JobRecord } from "@/lib/jobs/types";

function formatDate(value: string | null): string {
  if (!value) return "Not provided";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${month}/${day}/${year}` : value;
}

function formatPay(job: JobRecord, value: number | null): string {
  if (value === null) return "Not provided";
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: job.payType === "hourly" && value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return job.payType === "salary" ? `$${formatted} / year` : `$${formatted} / hour`;
}

function PayProgressChart({
  jobs,
  label,
}: {
  jobs: JobRecord[];
  label: string;
}) {
  const points = jobs.map((job, index) => ({
    job,
    index,
    value: job.isCurrent
      ? job.startPay ?? job.endPay ?? 0
      : job.endPay ?? job.startPay ?? 0,
  })).filter((point) => point.value > 0);
  if (points.length === 0) return null;

  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const padding = range * 0.18 || maximum * 0.08 || 1;
  const chartMinimum = Math.max(0, minimum - padding);
  const chartMaximum = maximum + padding;
  const chartRange = chartMaximum - chartMinimum;
  const left = 12;
  const right = 238;
  const top = 16;
  const bottom = 116;
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? (left + right) / 2 : left + (index / (points.length - 1)) * (right - left),
    y: bottom - ((point.value - chartMinimum) / chartRange) * (bottom - top),
    ...point,
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="jobs-pay-progress">
      <h3>{label}</h3>
      <svg
        className="jobs-pay-chart"
        viewBox="0 0 250 150"
        role="img"
        aria-label={`${label} pay progression across ${points.length} roles`}
      >
        <title>{label} pay progression</title>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = bottom - ratio * (bottom - top);
          return <line key={ratio} x1={left} x2={right} y1={y} y2={y} className="jobs-pay-grid" />;
        })}
        {coordinates.length > 1 && <polyline points={line} className="jobs-pay-line" />}
        {coordinates.map((point) => (
          <g key={point.job.id}>
            <circle cx={point.x} cy={point.y} r={5} className="jobs-pay-point">
              <title>{`${point.job.company}: ${formatPay(point.job, point.value)}`}</title>
            </circle>
            <text x={point.x} y={140} textAnchor={coordinates.length === 1 ? "middle" : point.index === 0 ? "start" : point.index === points.length - 1 ? "end" : "middle"} className="jobs-pay-year">
              {point.job.startDate?.slice(0, 4) ?? "—"}
            </text>
          </g>
        ))}
      </svg>
      <ol className="jobs-pay-chart-legend" aria-label={`${label} pay values`}>
        {points.slice(-4).reverse().map((point) => (
          <li key={point.job.id}>
            <span>{point.job.company}</span>
            <strong>{formatPay(point.job, point.value)}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CareerDashboard({ data }: { data: CareerLibrary }) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = useMemo(() => normalizedSearch
    ? data.jobs.filter((job) =>
        `${job.company} ${job.title} ${job.notes ?? ""}`.toLocaleLowerCase().includes(normalizedSearch),
      )
    : data.jobs, [data.jobs, normalizedSearch]);
  const repeatingCompanies = data.uniqueCompanies.filter((item) => item.count > 1);
  const hourlyProgression = useMemo(() => [...data.jobs]
    .filter((job) => job.payType === "hourly" && (job.startPay !== null || job.endPay !== null))
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")),
  [data.jobs]);
  const salaryProgression = useMemo(() => [...data.jobs]
    .filter((job) => job.payType === "salary" && (job.startPay !== null || job.endPay !== null))
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")),
  [data.jobs]);

  return (
    <div className="jobs-record">
      <Link href="/" className="jobs-back-link">
        <span aria-hidden="true">←</span> Life Dashboard
      </Link>
      <header className="jobs-masthead">
        <div>
          <p className="jobs-kicker">Employment register / {data.jobs.length} roles</p>
          <h1>Jobs</h1>
        </div>
        <label className="jobs-search">
          <span>Search roles</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Company, title, or note"
          />
        </label>
      </header>

      <section className="jobs-summary" aria-label="Career summary">
        <div><span>Roles</span><strong>{data.jobs.length}</strong></div>
        <div><span>Current</span><strong>{data.currentJobs.length}</strong></div>
        <div><span>Completed</span><strong>{data.completedJobs.length}</strong></div>
        <div><span>Companies</span><strong>{data.uniqueCompanies.length}</strong></div>
        <div><span>Hourly</span><strong>{data.hourlyJobs.length}</strong></div>
        <div><span>Salary</span><strong>{data.salaryJobs.length}</strong></div>
      </section>

      <div className="jobs-record-layout">
        <section className="jobs-timeline" aria-label="Career timeline">
          <div className="jobs-section-heading">
            <p>Role chronology</p>
            <span>{filtered.length} shown</span>
          </div>
          <ol>
            {filtered.map((job, index) => (
              <li key={job.id} className={job.isCurrent ? "is-current" : ""}>
                <time className="jobs-role-date" dateTime={job.startDate ?? undefined}>
                  {formatDate(job.startDate)}
                  <span>{job.isCurrent ? "Current" : `— ${formatDate(job.endDate)}`}</span>
                </time>
                <div className="jobs-role-marker" aria-hidden="true">
                  <span>{String(data.jobs.length - index).padStart(2, "0")}</span>
                </div>
                <article>
                  <p className="jobs-role-company">{job.company}</p>
                  <h2>{job.title}</h2>
                  <dl className="jobs-pay-ledger">
                    <div><dt>Start</dt><dd>{formatPay(job, job.startPay)}</dd></div>
                    <div><dt>End</dt><dd>{job.isCurrent ? "Current" : formatPay(job, job.endPay)}</dd></div>
                    <div><dt>Type</dt><dd>{job.payType === null ? "Not provided" : job.payType === "hourly" ? "Hourly" : "Salary"}</dd></div>
                  </dl>
                  {(job.notes || job.bonuses) && (
                    <details className="jobs-source-details">
                      <summary>Notes and bonuses</summary>
                      {job.notes && <p>{job.notes}</p>}
                      {job.bonuses && <p><strong>Bonuses:</strong> {job.bonuses}</p>}
                    </details>
                  )}
                </article>
              </li>
            ))}
          </ol>
          {filtered.length === 0 && <p className="jobs-empty">No roles match this search.</p>}
        </section>

        <aside className="jobs-side-ledger" aria-label="Career ledger">
          {(hourlyProgression.length > 0 || salaryProgression.length > 0) && (
            <section>
              <div className="jobs-section-heading">
                <p>Pay progression</p>
                <span>Separate units</span>
              </div>
              {[
                { payType: "hourly" as const, label: "Hourly", jobs: hourlyProgression },
                { payType: "salary" as const, label: "Salary", jobs: salaryProgression },
              ].filter((group) => group.jobs.length > 0).map((group) => {
                return (
                  <PayProgressChart
                    key={group.payType}
                    jobs={group.jobs}
                    label={group.label}
                  />
                );
              })}
            </section>
          )}

          {repeatingCompanies.length > 0 && (
            <section>
              <div className="jobs-section-heading">
                <p>Returning employers</p>
                <span>Exact company names</span>
              </div>
              <ol className="jobs-company-list">
                {repeatingCompanies.map((item, index) => (
                  <li key={item.company}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.company}</strong>
                    <em>{item.count}</em>
                  </li>
                ))}
              </ol>
            </section>
          )}

        </aside>
      </div>
    </div>
  );
}
