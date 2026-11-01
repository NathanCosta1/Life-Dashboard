"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { VaultLibrary } from "@/lib/vault/types";
import { lockVault, unlockVault } from "@/app/vault/actions";

function VaultGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [digits, setDigits] = useState<string[]>([]);
  const [status, setStatus] = useState<"awaiting" | "verifying" | "denied" | "granted">("awaiting");
  const [attempt, setAttempt] = useState(0);

  const verifySequence = async (sequence: string) => {
    setStatus("verifying");
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const result = await unlockVault(sequence);
    if (result.ok) {
      setStatus("granted");
      window.setTimeout(onUnlocked, 850);
    } else {
      setStatus("denied");
      setAttempt((value) => value + 1);
      window.setTimeout(() => {
        setDigits([]);
        setStatus("awaiting");
      }, 900);
    }
  };

  const enterDigit = (digit: string) => {
    if (status === "verifying" || status === "granted" || digits.length >= 4) return;
    setStatus("awaiting");
    const next = [...digits, digit];
    setDigits(next);
    if (next.length === 4) void verifySequence(next.join(""));
  };

  const eraseDigit = () => {
    if (status === "verifying" || status === "granted") return;
    setDigits((current) => current.slice(0, -1));
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) enterDigit(event.key);
      if (event.key === "Backspace" || event.key === "Delete") eraseDigit();
      if (event.key === "Enter" && digits.length === 4) setAttempt((value) => value + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const statusText = {
    awaiting: digits.length ? "Sequence entered" : "Awaiting input",
    verifying: "Verifying sequence",
    denied: "Access denied",
    granted: "Access granted",
  }[status];

  return (
    <div className={`vault-gate vault-gate-${status}`} key={attempt}>
      <div className="vault-grid" aria-hidden="true" />
      <main className="vault-terminal" aria-label="Private vault access">
        <header className="vault-terminal-header">
          <span>PRIVATE NODE // SECRET</span>
          <span>{statusText}</span>
        </header>
        <div className="vault-access-display" aria-live="polite" aria-label={`${digits.length} of 4 digits entered`}>
          {[0, 1, 2, 3].map((index) => (
            <div className={`vault-digit-slot ${digits[index] ? "is-filled" : ""}`} key={index}>
              <span>{digits[index] ?? "–"}</span>
              <small>0{index + 1}</small>
            </div>
          ))}
        </div>
        <div className="vault-status-line"><span className="vault-status-pulse" />{statusText}</div>
        <div className="vault-keypad" aria-label="Four digit keypad">
          {["1","2","3","4","5","6","7","8","9"].map((digit) => (
            <button type="button" key={digit} onClick={() => enterDigit(digit)} disabled={status === "verifying" || status === "granted"}>
              <span>{digit}</span>
            </button>
          ))}
          <button type="button" className="vault-key-clear" onClick={eraseDigit} aria-label="Delete digit" disabled={!digits.length}>CLR</button>
          <button type="button" onClick={() => enterDigit("0")} disabled={status === "verifying" || status === "granted"}><span>0</span></button>
          <button type="button" className="vault-key-enter" onClick={() => setAttempt((value) => value + 1)} aria-label="Submit sequence" disabled={digits.length !== 4}>ENT</button>
        </div>
      </main>
    </div>
  );
}

function Heatmap({ data }: { data: VaultLibrary }) {
  const [year, setYear] = useState<number>(data.yearCounts[0]?.year ?? 2026);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    data.events.filter((event) => event.year === year).forEach((event) => {
      result.set(event.date, (result.get(event.date) ?? 0) + 1);
    });
    return result;
  }, [data, year]);
  const cells = Array.from({ length: 371 }, (_, index) => {
    const date = new Date(year, 0, index + 1);
    if (date.getFullYear() !== year) return null;
    const iso = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { iso, count: counts.get(iso) ?? 0 };
  }).filter((value): value is { iso: string; count: number } => value !== null);
  const max = Math.max(1, ...cells.map((cell) => cell.count));

  return (
    <section className="vault-panel vault-heatmap-panel">
      <div className="vault-panel-heading">
        <div><span>CALENDAR MATRIX</span><h2>Activity map</h2></div>
        <select value={year} onChange={(event) => setYear(Number(event.target.value))} aria-label="Heatmap year">
          {data.yearCounts.map((item) => <option value={item.year} key={item.year}>{item.year}</option>)}
        </select>
      </div>
      <div className="vault-heatmap" aria-label={`Activity map for ${year}`}>
        {cells.map((cell) => (
          <span
            key={cell.iso}
            title={`${cell.iso}: ${cell.count}`}
            className={`vault-heat-cell level-${cell.count === 0 ? 0 : Math.min(4, Math.ceil(cell.count / max * 4))}`}
          />
        ))}
      </div>
      <div className="vault-heat-legend"><span>Less</span>{[0,1,2,3,4].map((level) => <i className={`level-${level}`} key={level} />)}<span>More</span></div>
    </section>
  );
}

export function VaultDashboard({ data, unlocked }: { data: VaultLibrary | null; unlocked: boolean }) {
  const router = useRouter();
  const [locked, setLocked] = useState(!unlocked);

  const handleLock = async () => {
    await lockVault();
    setLocked(true);
    router.refresh();
  };

  if (locked) {
    return <VaultGate onUnlocked={() => { setLocked(false); router.refresh(); }} />;
  }
  if (!data) return <div className="vault-loading">The vault is unavailable.</div>;

  const maxMonth = Math.max(...data.monthlyCounts.map((item) => item.count), 1);
  const maxDay = Math.max(...data.dayOfWeekCounts.map((item) => item.count), 1);
  const maxHour = Math.max(...data.hourlyCounts.map((item) => item.count), 1);
  const peakHour = data.hourlyCounts.reduce((peak, item) => item.count > peak.count ? item : peak, data.hourlyCounts[0]);
  const streakTimeline = data.events
    .filter((event) => event.streak !== null)
    .slice(0, 45)
    .reverse();
  const maxTimelineStreak = Math.max(...streakTimeline.map((event) => event.streak ?? 0), 1);

  return (
    <div className="vault-theme">
      <header className="vault-page-header">
        <div><p>SECRET PAGE</p><h1>Secret</h1></div>
        <button type="button" className="vault-lock-button" onClick={handleLock}>Lock page</button>
      </header>
      <section className="vault-metrics" aria-label="Vault summary">
        <article><span>Current streak</span><strong>{data.currentStreak}</strong><small>days</small></article>
        <article><span>Longest streak</span><strong>{data.longestStreak}</strong><small>days</small></article>
        <article><span>Recorded entries</span><strong>{data.totalEvents}</strong><small>total</small></article>
        <article><span>Years tracked</span><strong>{data.yearCounts.length}</strong><small>active</small></article>
      </section>
      <div className="vault-dashboard-grid">
        <Heatmap data={data} />
        <section className="vault-panel vault-streak-panel">
          <div className="vault-panel-heading">
            <div><span>STREAK INDEX</span><h2>Recent streaks</h2></div>
            <span className="vault-streak-best">Best: {data.longestStreak} days</span>
          </div>
          <div className="vault-streak-chart" aria-label="Recent recorded streak timeline">
            {streakTimeline.map((event) => (
              <div className="vault-streak-point" key={event.id} title={`${event.date}: ${event.streak} days`}>
                <span style={{ height: `${Math.max(5, (event.streak ?? 0) / maxTimelineStreak * 100)}%` }} />
                <small>{event.date.slice(5)}</small>
              </div>
            ))}
          </div>
          <div className="vault-streak-status">
            <span>Current sequence</span>
            <strong>{data.currentStreak} days</strong>
            <small>{data.currentStreak > 0 ? "Sequence active" : "Sequence reset"}</small>
          </div>
        </section>
        <section className="vault-panel vault-month-panel">
          <div className="vault-panel-heading"><div><span>FREQUENCY</span><h2>By month</h2></div></div>
          <div className="vault-bars">
            {data.monthlyCounts.map((item) => (
              <div className="vault-bar-column" key={item.month} title={`${item.month}: ${item.count}`}>
                <span style={{ height: `${Math.max(4, item.count / maxMonth * 100)}%` }} />
                <small>{item.month.slice(0, 1)}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="vault-panel vault-day-panel">
          <div className="vault-panel-heading"><div><span>PATTERN</span><h2>By weekday</h2></div></div>
          <div className="vault-horizontal-bars">
            {data.dayOfWeekCounts.map((item) => (
              <div className="vault-horizontal-row" key={item.day}>
                <span>{item.day.slice(0, 3)}</span><i><b style={{ width: `${item.count / maxDay * 100}%` }} /></i><strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="vault-panel vault-hour-panel">
          <div className="vault-panel-heading"><div><span>TIME INDEX</span><h2>By hour</h2></div></div>
          <p className="vault-hour-peak">{peakHour ? `${String(peakHour.hour).padStart(2, "0")}:00 peak` : "No time data"}</p>
          <div className="vault-hour-bars">
            {data.hourlyCounts.map((item) => (
              <span key={item.hour} title={`${item.hour}:00: ${item.count}`} style={{ height: `${Math.max(3, item.count / maxHour * 100)}%` }} />
            ))}
          </div>
        </section>
        <section className="vault-panel vault-recent-panel">
          <div className="vault-panel-heading"><div><span>LOG</span><h2>Recent entries</h2></div></div>
          <div className="vault-recent-list">
            {data.events.slice(0, 15).map((event) => (
              <div key={event.id}><time dateTime={event.date}>{event.date}</time><span>{event.time ?? "—"}</span><strong>{event.streak ?? "—"}</strong></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
