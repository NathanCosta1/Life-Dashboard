"use client";

import { useMemo, useState } from "react";
import type { VacationDashboardModel } from "@/lib/finance";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const formatCurrency = (value: number | null) => value === null ? "—" : currency.format(value);

export function VacationsDashboard({ model }: { model: VacationDashboardModel }) {
  const [year, setYear] = useState<number | "all">("all");
  const [selected, setSelected] = useState(model.trips[0]?.name ?? "");
  const annualTotals = model.annualTotals ?? [];
  const trips = useMemo(() => year === "all" ? model.trips : model.trips.filter((trip) => trip.year === year), [model.trips, year]);
  const selectedTrip = trips.find((trip) => trip.name === selected) ?? trips[0] ?? null;
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Finance / Vacations</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Vacations</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Trip history, spending, and duration across the travel workbook.</p>
      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Vacation years">
        <button type="button" onClick={() => setYear("all")} className={`rounded-lg border px-3 py-2 text-sm ${year === "all" ? "bg-accent" : "bg-card"}`}>Overview</button>
        {model.years.map((item) => <button type="button" key={item} onClick={() => setYear(item)} className={`rounded-lg border px-3 py-2 text-sm ${year === item ? "bg-accent" : "bg-card"}`}>{item}</button>)}
      </div>
      {year === "all" && (
        <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Trips" value={String(model.totals.tripCount)} detail="Recorded tabs" />
          <Metric label="Total spent" value={formatCurrency(model.totals.totalCost)} detail="All recorded trips" />
          <Metric label="Average trip cost" value={formatCurrency(model.totals.averageCost)} detail="Across all trips" />
          <Metric label="Average length" value={model.totals.averageDuration ? `${model.totals.averageDuration.toFixed(1)} days` : "—"} detail="Across all trips" />
          <Metric label="Average cost/day" value={formatCurrency(model.totals.averageCostPerDay)} detail="Across all trips" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between"><div><h2 className="font-medium">Spending by year</h2><p className="mt-1 text-sm text-muted-foreground">Total recorded trip costs by start year.</p></div><span className="text-sm text-muted-foreground">{annualTotals.length} years</span></div>
            <div className="mt-6 flex h-48 items-end gap-5 border-b border-border pb-7">
              {annualTotals.map((item) => <div key={item.year} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(item.total)}</span><div className="w-full max-w-16 rounded-t-md bg-cyan-400/80" style={{ height: `${Math.max(6, (item.total / Math.max(...annualTotals.map((entry) => entry.total), 1)) * 82)}%` }} /><span className="text-xs text-muted-foreground">{item.year}</span></div>)}
            </div>
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-medium">Biggest adventure</h2>
            <p className="mt-1 text-sm text-muted-foreground">The trip with the highest recorded total.</p>
            <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-2xl font-semibold">{model.totals.mostExpensive?.name ?? "—"}</p><p className="mt-1 text-sm text-muted-foreground">{model.totals.mostExpensive?.durationDays ?? "—"} days</p></div><p className="text-3xl font-semibold tabular-nums text-cyan-300">{formatCurrency(model.totals.mostExpensive?.total ?? null)}</p></div>
            <div className="mt-6 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">The longest trip was {model.totals.longest?.name ?? "—"} at {model.totals.longest?.durationDays ?? "—"} days.</div>
          </section>
        </div>
        </>
      )}
      <section className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-medium">{year === "all" ? "All trips" : `${year} trips`}</h2><p className="mt-1 text-sm text-muted-foreground">Select a trip to inspect its details.</p></div><span className="text-sm text-muted-foreground">{trips.length} trip{trips.length === 1 ? "" : "s"}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => <button type="button" key={trip.name} onClick={() => setSelected(trip.name)} className={`rounded-lg border p-4 text-left transition-colors hover:border-foreground/40 ${selectedTrip?.name === trip.name ? "border-cyan-400/60 bg-cyan-400/5" : ""}`}><p className="font-medium">{trip.name}</p><p className="mt-1 text-xs text-muted-foreground">{trip.dateLabel ?? "Dates unavailable"}</p><div className="mt-4 flex justify-between text-sm"><span>{trip.durationDays ? `${trip.durationDays} days` : "—"}</span><span className="tabular-nums">{formatCurrency(trip.total)}</span></div></button>)}
        </div>
      </section>
      {selectedTrip && (
        <section className="mt-6 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-medium">{selectedTrip.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedTrip.dateLabel ?? "Dates unavailable"}</p></div><div className="text-right"><p className="text-2xl font-semibold tabular-nums">{formatCurrency(selectedTrip.total)}</p><p className="text-xs text-muted-foreground">{selectedTrip.durationDays && selectedTrip.total ? `${formatCurrency(selectedTrip.total / selectedTrip.durationDays)} per day` : "Daily cost unavailable"}</p></div></div>
          <div className="mt-5 divide-y">{selectedTrip.expenses.map((expense) => <div key={`${expense.rowNumber}-${expense.label}`} className="flex justify-between gap-4 py-3 text-sm"><span>{expense.label}</span><span className="tabular-nums">{formatCurrency(expense.amount)}</span></div>)}</div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
