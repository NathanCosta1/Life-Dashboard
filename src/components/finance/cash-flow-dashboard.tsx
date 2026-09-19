"use client";

import type { CashFlowDashboardModel } from "@/lib/finance";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

function formatCurrency(value: number | null) {
  return value === null ? "—" : currency.format(value);
}

function valueLabel(value: number | null) {
  return value === null ? "No record" : formatCurrency(value);
}

export function CashFlowDashboard({ model }: { model: CashFlowDashboardModel }) {
  const latest = model.latest;
  const max = Math.max(...model.years.flatMap((year) => [year.income?.value ?? 0, year.expenses?.value ?? 0]), 1);
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Finance / Income &amp; expenses</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Income &amp; expenses</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Annual cash-flow records and the resulting savings rate.</p>
      {latest ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Latest income</p><p className="mt-3 text-3xl font-semibold tabular-nums">{valueLabel(latest.income?.value ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">{latest.year}</p></div>
            <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Latest expenses</p><p className="mt-3 text-3xl font-semibold tabular-nums">{valueLabel(latest.expenses?.value ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">{latest.year}</p></div>
            <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Savings rate</p><p className="mt-3 text-3xl font-semibold tabular-nums">{latest.savingsRate === null ? "—" : percent.format(latest.savingsRate)}</p><p className="mt-1 text-xs text-muted-foreground">{latest.savings === null ? "Requires both records" : `${formatCurrency(latest.savings)} retained`}</p></div>
          </div>
          <section className="mt-6 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-medium">Annual comparison</h2><p className="mt-1 text-sm text-muted-foreground">Missing records remain distinct from recorded zero values.</p></div><div className="flex gap-3 text-xs text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />Income</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-400" />Expenses</span></div></div>
            <div className="mt-6 flex h-72 items-end gap-4 overflow-x-auto border-b border-border pb-8">
              {model.years.map((row) => <div key={row.year} className="flex h-full min-w-16 flex-1 items-end justify-center gap-1 text-center">
                <div className="flex h-full flex-1 flex-col justify-end"><div className="rounded-t-md bg-cyan-400/80" style={{ height: `${row.income ? Math.max(3, (row.income.value / max) * 88) : 0}%` }} title={`${row.year} income: ${valueLabel(row.income?.value ?? null)}`} /><span className="mt-2 text-xs text-muted-foreground">{row.year}</span></div>
                <div className="flex h-full flex-1 flex-col justify-end"><div className="rounded-t-md bg-violet-400/80" style={{ height: `${row.expenses ? Math.max(3, (row.expenses.value / max) * 88) : 0}%` }} title={`${row.year} expenses: ${valueLabel(row.expenses?.value ?? null)}`} /><span className="mt-2 text-xs text-transparent">{row.year}</span></div>
              </div>)}
            </div>
          </section>
          <section className="mt-6 rounded-xl border bg-card p-5">
            <h2 className="font-medium">Yearly details</h2>
            <div className="mt-4 divide-y">{model.years.map((row) => <div key={row.year} className="grid gap-2 py-4 text-sm sm:grid-cols-5 sm:items-center"><span className="font-medium">{row.year}</span><span className="text-muted-foreground">Income <strong className="ml-1 font-medium text-foreground">{valueLabel(row.income?.value ?? null)}</strong></span><span className="text-muted-foreground">Expenses <strong className="ml-1 font-medium text-foreground">{valueLabel(row.expenses?.value ?? null)}</strong></span><span className="text-muted-foreground">Savings <strong className="ml-1 font-medium text-foreground">{formatCurrency(row.savings)}</strong></span><span className="text-muted-foreground">Rate <strong className="ml-1 font-medium text-foreground">{row.savingsRate === null ? "—" : percent.format(row.savingsRate)}</strong></span></div>)}</div>
          </section>
        </>
      ) : <div className="mt-8 rounded-xl border border-dashed bg-card p-8"><p className="font-medium">No income or expense records are available.</p><p className="mt-2 text-sm text-muted-foreground">The connected annual datasets do not contain usable records yet.</p></div>}
    </div>
  );
}
