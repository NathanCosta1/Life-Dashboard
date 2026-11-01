"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { MeditationData, MeditationDay, MeditationYearData } from "@/lib/meditation/types";
import "./meditation.css";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function subscribeToday() {
  return () => {};
}

function getClientTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getServerTodayIso() {
  return "";
}

function formatMinutes(minutes: number): string {
  const rounded = Number.isInteger(minutes) ? minutes : Number(minutes.toFixed(1));
  return `${rounded} min`;
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

export function MeditationDashboard({ data }: { data: MeditationData }) {
  const [selectedYear, setSelectedYear] = useState(data.activeYear);
  const year = data.years.find((item) => item.year === selectedYear) ?? data.years[0];
  const [motion, setMotion] = useState<"full" | "reduced">("full");
  const [trendMode, setTrendMode] = useState<"daily" | "7-day" | "30-day">("7-day");
  const [weekdayMode, setWeekdayMode] = useState<"Minutes" | "Active days">("Minutes");
  const [selectedDay, setSelectedDay] = useState<MeditationDay | null>(null);
  const todayIso = useSyncExternalStore(subscribeToday, getClientTodayIso, getServerTodayIso);

  const latest = year?.sessions.reduce<MeditationYearData["sessions"][number] | null>(
    (latestSession, session) =>
      !latestSession || session.date > latestSession.date ||
      (session.date === latestSession.date && session.sourceRow > latestSession.sourceRow)
        ? session
        : latestSession,
    null,
  ) ?? null;
  const latestMonth = latest ? Number(latest.date.slice(5, 7)) : 1;
  const [selectedMonth, setSelectedMonth] = useState(latestMonth);

  const trend = useMemo(() => {
    if (!year) {
      return { points: "", area: `0,230 0,230 1000,230`, max: 5 };
    }
    const values = year.days.map((day) => {
      if (trendMode === "daily") return day.totalMinutes;
      const windowSize = trendMode === "7-day" ? 7 : 30;
      const index = year.days.indexOf(day);
      const window = year.days.slice(Math.max(0, index - windowSize + 1), index + 1);
      return window.reduce((sum, item) => sum + item.totalMinutes, 0) / window.length;
    });
    const max = Math.max(5, ...values);
    const width = 1000;
    const height = 230;
    const points = values.map((value, index) => {
      const x = year.days.length === 1 ? 0 : (index / (year.days.length - 1)) * width;
      const y = height - (value / max) * (height - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { points: points.join(" "), area: `0,${height} ${points.join(" ")} ${width},${height}`, max };
  }, [year, trendMode]);

  if (!year) {
    return (
      <div className="meditation-shell meditation-empty">
        <p className="meditation-kicker">Meditation</p>
        <h1>No practice found yet</h1>
        <p>Add a valid `Date`, `Duration`, and start-time row to the configured workbook.</p>
      </div>
    );
  }

  const yearDays = year.days.filter((day) => Number(day.date.slice(5, 7)) === selectedMonth);
  const monthLabel = MONTH_NAMES[selectedMonth - 1];
  const heroDay = year.days.find((day) => day.date === todayIso)
    ?? (latest ? year.days.find((day) => day.date === latest.date) : null);
  const latestDate = latest?.date;
  const daysSinceLatest = latestDate
    ? todayIso
      ? Math.floor((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${latestDate}T00:00:00Z`)) / 86_400_000)
      : null
    : null;
  const copySummary = async () => {
    const text = `${year.year} meditation: ${year.summary.totalSessions} sessions, ${formatMinutes(year.summary.totalMinutes)}, ${year.summary.activeDays} active days, ${year.summary.longestStreak}-day longest streak.`;
    await navigator.clipboard?.writeText(text);
  };

  const changeMonth = (offset: number) => {
    setSelectedMonth((month) => {
      const next = month + offset;
      return next < 1 ? 12 : next > 12 ? 1 : next;
    });
  };

  return (
    <div className={`meditation-shell ${motion === "reduced" ? "motion-reduced" : ""}`}>
      <div className="meditation-ambient" aria-hidden="true" />
      <header className="meditation-header">
        <div>
          <p className="meditation-kicker">Meditation practice</p>
          <h1>{year.year} in stillness</h1>
        </div>
        <div className="meditation-controls">
          {data.years.length > 1 && (
            <label>
              <span>Year</span>
              <select value={year.year} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                {data.years.map((item) => <option key={item.year} value={item.year}>{item.year}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="motion-toggle" onClick={() => setMotion((value) => value === "full" ? "reduced" : "full")}>
            Motion: {motion}
          </button>
          <button type="button" className="copy-button" onClick={copySummary}>Copy summary</button>
        </div>
      </header>

      <section className="practice-hero" aria-label="Practice summary">
        <div className="orb-column">
          <div
            className={`practice-orb ${heroDay?.sessionCount ? "is-active" : ""}`}
            style={{ "--orb-scale": String(Math.min(1.18, 0.82 + (heroDay?.totalMinutes ?? 0) / 100)) } as React.CSSProperties}
          >
            <div className="orb-ring orb-ring-one" />
            <div className="orb-ring orb-ring-two" />
            <div className="orb-core">
              <strong>{heroDay?.totalMinutes ?? 0}</strong>
              <span>minutes</span>
              <small>{heroDay?.sessionCount ? `${heroDay.sessionCount} session${heroDay.sessionCount === 1 ? "" : "s"}` : "rest day"}</small>
            </div>
          </div>
          <p className="orb-caption">{heroDay?.date === todayIso ? "Today" : "Latest practice"} · {heroDay ? formatDate(heroDay.date) : "No session"}</p>
        </div>

        <div className="hero-metrics">
          <article className="hero-stat hero-stat-featured">
            <span>Current path</span>
            <strong>{year.summary.currentStreak}</strong>
            <small>day streak</small>
          </article>
          <article className="hero-stat">
            <span>Longest path</span>
            <strong>{year.summary.longestStreak}</strong>
            <small>days</small>
          </article>
          <article className="hero-stat">
            <span>Last practice</span>
            <strong>{daysSinceLatest === 0 ? "Today" : daysSinceLatest === 1 ? "1 day" : `${daysSinceLatest ?? 0} days`}</strong>
            <small>since</small>
          </article>
          <article className="hero-stat hero-stat-wide">
            <span>Total practice</span>
            <strong>{formatMinutes(year.summary.totalMinutes)}</strong>
            <small>{year.summary.totalSessions} sessions · {year.summary.activeDays} active days</small>
          </article>
        </div>
      </section>

      <section className="rhythm-section" aria-labelledby="rhythm-title">
        <div className="section-heading">
          <div>
            <p className="meditation-kicker">Monthly practice</p>
            <h2 id="rhythm-title">{monthLabel}</h2>
          </div>
          <div className="month-controls">
            <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>←</button>
            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>→</button>
          </div>
        </div>

        <div className="practice-garden" role="list" aria-label={`${monthLabel} daily practice calendar`}>
          {WEEKDAY_NAMES.map((name) => <span className="weekday-label" key={name}>{name}</span>)}
          {yearDays.map((day, index) => {
            const firstWeekday = index === 0 ? new Date(`${day.date}T00:00:00Z`).getUTCDay() : null;
            const leading = firstWeekday !== null ? Array.from({ length: firstWeekday }, (_, spacerIndex) => (
              <span className="garden-spacer" key={`spacer-${spacerIndex}`} aria-hidden="true" />
            )) : [];
            return [
              ...leading,
              <button
                type="button"
                role="listitem"
                key={day.date}
                className={`garden-node ${day.sessionCount ? "is-active" : ""} ${day.date === todayIso ? "is-today" : ""}`}
                style={{ "--node-size": String(8 + Math.min(18, day.totalMinutes * 0.24)) } as React.CSSProperties}
                onClick={() => setSelectedDay(day)}
                aria-label={`${formatDate(day.date)}: ${day.totalMinutes ? formatMinutes(day.totalMinutes) : "no practice"}`}
              >
                <span className="garden-number">{Number(day.date.slice(8, 10))}</span>
                {day.sessionCount > 0 && <span className="garden-pulse" />}
              </button>,
            ];
          })}
        </div>
      </section>

      <section className="year-rhythm" aria-labelledby="year-rhythm-title">
        <div className="section-heading">
          <div>
            <p className="meditation-kicker">Yearly practice</p>
            <h2 id="year-rhythm-title">Practice trend</h2>
          </div>
          <div className="segmented-control" aria-label="Trend smoothing">
            {(["daily", "7-day", "30-day"] as const).map((mode) => (
              <button type="button" key={mode} className={trendMode === mode ? "is-selected" : ""} onClick={() => setTrendMode(mode)}>
                {mode === "daily" ? "Daily" : mode === "7-day" ? "7-day" : "30-day"}
              </button>
            ))}
          </div>
        </div>
        <div className="landscape-chart">
          <svg viewBox="0 0 1000 230" role="img" aria-label={`Daily meditation minutes with ${trendMode} smoothing`}>
            <defs>
              <linearGradient id="meditationArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d7a7ff" stopOpacity="0.52" />
                <stop offset="100%" stopColor="#5b3d9a" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <line x1="0" y1="220" x2="1000" y2="220" className="chart-baseline" />
            <polygon points={trend.area} fill="url(#meditationArea)" />
            <polyline points={trend.points} fill="none" className="chart-line" />
            <line x1="0" y1="182" x2="1000" y2="182" className="goal-line" />
          </svg>
          <div className="month-axis">
            {MONTH_NAMES.map((month) => <span key={month}>{month}</span>)}
          </div>
        </div>
        <p className="chart-summary">
          {trendMode === "daily" ? "Daily minutes" : `${trendMode} rolling average`} · Peak {formatMinutes(trend.max)}
        </p>
        <details className="data-details">
          <summary>View monthly totals</summary>
          <table>
            <thead><tr><th>Month</th><th>Active days</th><th>Minutes</th></tr></thead>
            <tbody>{year.months.map((month) => <tr key={month.month}><td>{month.label}</td><td>{month.activeDays}</td><td>{month.totalMinutes}</td></tr>)}</tbody>
          </table>
        </details>
      </section>

      <div className="meditation-lower-grid">
        <section className="constellation-section" aria-labelledby="constellation-title">
          <div className="section-heading">
            <div>
              <p className="meditation-kicker">When practice happens</p>
              <h2 id="constellation-title">Time of day</h2>
            </div>
          </div>
          <div className="constellation">
            {year.timeOfDay.map((bucket, index) => (
              <button
                type="button"
                key={bucket.name}
                className={`constellation-node constellation-${index + 1}`}
                style={{ "--constellation-size": String(72 + Math.min(60, bucket.sessionCount * 0.7)) } as React.CSSProperties}
                onClick={() => setSelectedDay(bucket.sessionCount ? year.days.find((day) => day.sessions.some((session) => session.timeOfDay === bucket.name)) ?? null : null)}
                aria-label={`${bucket.name}: ${bucket.sessionCount} sessions, ${formatMinutes(bucket.totalMinutes)}, ${bucket.share.toFixed(0)} percent of sessions`}
              >
                <span>{bucket.name}</span>
                <strong>{bucket.sessionCount}</strong>
              </button>
            ))}
          </div>
          <div className="constellation-table">
            {year.timeOfDay.map((bucket) => (
              <div key={bucket.name}>
                <span>{bucket.name}</span>
                <strong>{formatMinutes(bucket.totalMinutes)}</strong>
                <small>{bucket.share.toFixed(0)}% of sessions</small>
              </div>
            ))}
          </div>
        </section>

        <section className="weekday-section" aria-labelledby="weekday-title">
          <div className="section-heading">
            <div>
              <p className="meditation-kicker">Consistency</p>
              <h2 id="weekday-title">Weekly tide</h2>
            </div>
            <div className="segmented-control compact-control">
              {(["Minutes", "Active days"] as const).map((mode) => (
                <button type="button" key={mode} className={weekdayMode === mode ? "is-selected" : ""} onClick={() => setWeekdayMode(mode)}>{mode}</button>
              ))}
            </div>
          </div>
          <div className="weekday-wave">
            {year.weekdayTotals.map((item, index) => {
              const max = Math.max(1, ...year.weekdayTotals.map((day) => weekdayMode === "Minutes" ? day.totalMinutes : day.activeDays));
              const value = weekdayMode === "Minutes" ? item.totalMinutes : item.activeDays;
              return (
                <div className="weekday-column" key={item.name} title={`${item.name}: ${value}`}>
                  <span className="weekday-value">{value}</span>
                  <div className="weekday-bar" style={{ "--bar-height": `${Math.max(12, value / max * 130)}px`, "--bar-delay": `${index * 80}ms` } as React.CSSProperties} />
                  <span>{WEEKDAY_NAMES[index]}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="records-section" aria-labelledby="records-title">
        <div className="section-heading">
          <div>
            <p className="meditation-kicker">Milestones</p>
            <h2 id="records-title">Practice records</h2>
          </div>
        </div>
        <div className="record-orbits">
          <article><span>Longest streak</span><strong>{year.summary.longestStreak}</strong><small>days</small></article>
          <article><span>Longest session</span><strong>{year.summary.longestSessionMinutes}</strong><small>minutes</small></article>
          <article><span>Longest day</span><strong>{year.summary.longestDayMinutes}</strong><small>{year.summary.longestDayDate ? formatDate(year.summary.longestDayDate) : "minutes"}</small></article>
          <article><span>Most active month</span><strong>{year.summary.mostActiveMonth ?? "—"}</strong><small>{year.summary.mostActiveMonthDays} days</small></article>
          <article><span>Average session</span><strong>{Number(year.summary.averageSessionMinutes.toFixed(1))}</strong><small>minutes</small></article>
        </div>
      </section>

      {selectedDay && (
        <aside className="session-panel" role="dialog" aria-label={`Practice details for ${formatDate(selectedDay.date)}`} aria-modal="false">
          <button className="session-close" type="button" aria-label="Close session details" onClick={() => setSelectedDay(null)}>×</button>
          <p className="meditation-kicker">{formatDate(selectedDay.date)}</p>
          <h2>{formatMinutes(selectedDay.totalMinutes)}</h2>
          <p>{selectedDay.sessionCount} session{selectedDay.sessionCount === 1 ? "" : "s"}</p>
          <div className="session-list">
            {selectedDay.sessions.map((session) => (
              <article key={session.sourceRow}>
                <span>{session.startTime || "Time not recorded"}</span>
                <strong>{formatMinutes(session.durationMinutes)}</strong>
                {session.notes && <p>{session.notes}</p>}
              </article>
            ))}
            {!selectedDay.sessions.length && <p>No practice recorded on this date.</p>}
          </div>
        </aside>
      )}
    </div>
  );
}
