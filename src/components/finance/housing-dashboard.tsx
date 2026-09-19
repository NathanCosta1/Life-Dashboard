"use client";

import type { HousingDashboardModel } from "@/lib/finance";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const formatCurrency = (value: number | null) => value === null ? "—" : currency.format(value);

export function HousingDashboard({ model }: { model: HousingDashboardModel }) {
  const maxMonthly = Math.max(...model.monthly.map((row) => row.total ?? 0), 1);
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Finance / Housing</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Housing</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Move-in costs, setup spending, and recurring apartment expenses.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Monthly average" value={formatCurrency(model.monthlyAverage)} detail="Recorded monthly totals" />
        <Metric label="Move-in costs" value={formatCurrency(model.moveInTotal)} detail="Non-recurring charges" />
        <Metric label="Setup & furnishing" value={formatCurrency(model.itemsTotal)} detail="Items section total" />
        <Metric label="Monthly records" value={String(model.monthly.length)} detail="Rows in the source table" />
      </div>
      <section className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-medium">Monthly housing costs</h2><p className="mt-1 text-sm text-muted-foreground">Recurring totals from the apartment sheet.</p></div><span className="text-sm text-muted-foreground">Water and electric vary</span></div>
        <div className="mt-6 flex h-64 items-end gap-3 overflow-x-auto border-b border-border pb-8">
          {model.monthly.map((row) => <div key={row.location.rowNumber} className="flex h-full min-w-16 flex-1 flex-col justify-end gap-2 text-center"><span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(row.total)}</span><div className="rounded-t-md bg-cyan-400/80" style={{ height: `${row.total === null ? 0 : Math.max(4, (row.total / maxMonthly) * 82)}%` }} /><span className="text-xs text-muted-foreground">{row.month.replace(/\s+2026$/, "").slice(0, 3)}</span></div>)}
        </div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5"><h2 className="font-medium">Move-in costs</h2><div className="mt-4 divide-y">{model.moveIn.map((row) => <div key={row.location.rowNumber} className="flex justify-between gap-4 py-3 text-sm"><span>{row.label}</span><span className="tabular-nums">{formatCurrency(Number(row.value.replace(/[$,]/g, "")) || null)}</span></div>)}</div></div>
        <div className="rounded-xl border bg-card p-5"><h2 className="font-medium">Setup & furnishing</h2><div className="mt-4 divide-y">{model.items.map((row) => <div key={row.location.rowNumber} className="flex justify-between gap-4 py-3 text-sm"><span>{row.label}</span><span className="tabular-nums">{formatCurrency(Number(row.value.replace(/[$,]/g, "")) || null)}</span></div>)}</div></div>
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
