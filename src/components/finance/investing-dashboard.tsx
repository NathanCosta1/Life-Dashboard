"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { InvestmentDashboardModel } from "@/lib/finance";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const accountColors = [
  "#22d3ee",
  "#a78bfa",
  "#fbbf24",
  "#34d399",
  "#fb7185",
];

function formatCurrency(value: number | null) {
  return value === null ? "—" : currency.format(value);
}

function monthName(month: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2024, month - 1, 1));
}

function accountColor(account: string, accounts: string[]) {
  const index = accounts.indexOf(account);
  return accountColors[(index === -1 ? 0 : index) % accountColors.length];
}

function updateQuery(router: ReturnType<typeof useRouter>, params: URLSearchParams, key: string, value: string) {
  params.set(key, value);
  router.replace(`/finance/investing?${params.toString()}`, { scroll: false });
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ContributionChart({ model, selectedMonth, onSelect }: {
  model: InvestmentDashboardModel;
  selectedMonth: number | null;
  onSelect: (month: number) => void;
}) {
  const [hovered, setHovered] = useState<{
    month: InvestmentDashboardModel["months"][number];
    account?: string;
    amount?: number;
    color?: string;
    x: number;
    y: number;
  } | null>(null);
  const accountNames = model.accountSummaries.map((account) => account.account);
  const max = Math.max(...model.months.map((month) => month.total), 1);
  const width = 720;
  const height = 260;
  const chartBottom = 220;
  const barWidth = Math.max(22, Math.min(48, 560 / Math.max(model.months.length, 1)));

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[620px]">
      <svg className="block w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly investment contributions by account">
        <line x1="42" x2="700" y1={chartBottom} y2={chartBottom} stroke="currentColor" className="text-border" />
        {model.months.map((month, index) => {
          const x = 58 + index * (620 / Math.max(model.months.length, 1));
          let y = chartBottom;
          const selected = selectedMonth === month.month;
          return (
            <g
              key={month.period}
              className="cursor-pointer"
              onClick={() => onSelect(month.month)}
              onMouseEnter={() => setHovered({ month, x: (x / width) * 100, y: 4 })}
              onFocus={() => setHovered({ month, x: (x / width) * 100, y: 4 })}
              onMouseLeave={() => setHovered(null)}
              onBlur={() => setHovered(null)}
            >
              {month.accounts.map((account) => {
                const barHeight = (account.amount / max) * 170;
                const segmentY = y - barHeight;
                const color = accountColor(account.account, accountNames);
                y -= barHeight;
                return (
                  <rect
                    key={`${month.period}-${account.account}`}
                    x={x - barWidth / 2}
                    y={segmentY}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill={color}
                    opacity={selected ? 1 : 0.8}
                    onMouseEnter={(event) => {
                      event.stopPropagation();
                      setHovered({
                        month,
                        account: account.account,
                        amount: account.amount,
                        color,
                        x: (x / width) * 100,
                        y: ((segmentY + barHeight / 2) / height) * 100,
                      });
                    }}
                    onFocus={() => setHovered({
                      month,
                      account: account.account,
                      amount: account.amount,
                      color,
                      x: (x / width) * 100,
                      y: ((segmentY + barHeight / 2) / height) * 100,
                    })}
                  >
                  </rect>
                );
              })}
              {selected && <rect x={x - barWidth / 2 - 3} y={20} width={barWidth + 6} height={200} rx="6" fill="none" stroke="white" strokeDasharray="4 4" />}
              <text x={x} y="242" textAnchor="middle" className="fill-muted-foreground text-[10px]">{monthName(month.month).slice(0, 3)}</text>
            </g>
          );
        })}
        {model.rollingAverage.map((point, index) => {
          const x = 58 + index * (620 / Math.max(model.months.length, 1));
          const y = chartBottom - (point.average / max) * 170;
          const next = model.rollingAverage[index + 1];
          if (!next) return null;
          const nextX = 58 + (index + 1) * (620 / Math.max(model.months.length, 1));
          const nextY = chartBottom - (next.average / max) * 170;
          return <line key={point.period} x1={x} y1={y} x2={nextX} y2={nextY} stroke="#f8fafc" strokeWidth="2" strokeDasharray="5 4" />;
        })}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 w-64 rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur-sm"
          role="status"
          style={{
            left: `${hovered.x}%`,
            top: `${hovered.y}%`,
            transform: hovered.x > 68 ? "translate(-105%, -50%)" : "translate(5%, -50%)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{monthName(hovered.month.month)} {hovered.month.year}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(hovered.month.total)} total contributions</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {(hovered.account
              ? hovered.month.accounts.filter((account) => account.account === hovered.account)
              : hovered.month.accounts
            ).map((account) => (
              <span key={account.account} className="inline-flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accountColor(account.account, accountNames) }} />
                <span className="text-muted-foreground">{account.account}</span>
                <span className="font-medium tabular-nums">{formatCurrency(account.amount)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export function InvestingDashboard({ model, emptyTabs }: { model: InvestmentDashboardModel; emptyTabs: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(model.bestMonth?.month ?? model.months.at(-1)?.month ?? null);
  const view = searchParams.get("view") === "detail" ? "detail" : "overview";
  const selected = model.months.find((month) => month.month === selectedMonth) ?? null;
  const activeYear = model.selectedYear;
  const selectedTabEmpty = activeYear !== null && emptyTabs.includes(String(activeYear));
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function setYear(year: string) {
    updateQuery(router, params, "year", year);
  }

  function setView(nextView: string) {
    updateQuery(router, params, "view", nextView);
  }

  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            <Link href="/finance" className="hover:text-foreground">Finance</Link> / Investing
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Investing</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Contribution activity across retirement and taxable accounts.</p>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="investment-year">Investment year</label>
          <select id="investment-year" value={activeYear ?? ""} onChange={(event) => setYear(event.target.value)} className="rounded-lg border bg-card px-3 py-2 text-sm">
            {model.years.map((year) => <option key={year} value={year}>{year}{emptyTabs.includes(String(year)) ? " — no data" : ""}</option>)}
          </select>
          <label className="sr-only" htmlFor="investment-view">Investment view</label>
          <select id="investment-view" value={view} onChange={(event) => setView(event.target.value)} className="rounded-lg border bg-card px-3 py-2 text-sm">
            <option value="overview">Overview</option>
            <option value="detail">Monthly detail</option>
          </select>
        </div>
      </div>

      {selectedTabEmpty ? (
        <div className="mt-8 rounded-xl border border-dashed bg-card p-8">
          <p className="font-medium">{activeYear} is ready but has no investment records yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Choose a populated year to explore contributions.</p>
        </div>
      ) : model.months.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed bg-card p-8">
          <p className="font-medium">No investment records are available.</p>
          <p className="mt-2 text-sm text-muted-foreground">The connected investment tabs do not contain usable month rows.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Total invested" value={formatCurrency(model.totalInvested)} detail={`${activeYear} contributions`} />
            <MetricCard
              label="Monthly average"
              value={formatCurrency(model.averageMonthlyContribution)}
              detail={model.averageMonthlyContribution ? `${formatCurrency(model.averageMonthlyContribution * 12)} projected yearly` : "No projection available"}
            />
            <MetricCard label="Best month" value={formatCurrency(model.bestMonth?.total ?? null)} detail={model.bestMonth ? monthName(model.bestMonth.month) : "No data"} />
          </div>

          {view === "overview" && (
            <>
              <section className="mt-6 rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium">Monthly contributions</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Bars show account contributions. The dashed line is the three-month rolling average.</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.coverage.recordedMonths} / {model.coverage.expectedMonths} months recorded</p>
                </div>
                <div className="mt-4"><ContributionChart model={model} selectedMonth={selectedMonth} onSelect={setSelectedMonth} /></div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {model.accountSummaries.map((account) => <span key={account.account} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: accountColor(account.account, model.accountSummaries.map((item) => item.account)) }} />{account.account}</span>)}
                </div>
              </section>
              <section className="mt-6 rounded-xl border bg-card p-5">
                <div>
                  <h2 className="font-medium">Contribution calendar</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Monthly activity across the selected year.</p>
                  <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = model.months.find((item) => item.month === index + 1);
                      const intensity = month ? Math.min(1, month.total / Math.max(model.bestMonth?.total ?? 1, 1)) : 0;
                      return <button key={index} type="button" onClick={() => month && setSelectedMonth(month.month)} className="group rounded-lg text-left" title={`${monthName(index + 1)}: ${formatCurrency(month?.total ?? 0)}`}>
                        <div className="aspect-square rounded-md border" style={{ backgroundColor: month ? `color-mix(in srgb, #22d3ee ${Math.max(12, Math.round(intensity * 100))}%, transparent)` : undefined }} />
                        <span className="mt-1 block text-center text-[10px] text-muted-foreground">{monthName(index + 1).slice(0, 3)}</span>
                      </button>;
                    })}
                  </div>
                </div>
              </section>
              <section className="mt-6">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="font-medium">Prior contributions and new contributions</h2>
                  <p className="mt-1 text-sm text-muted-foreground">The source tracks previously accumulated contributions separately from this year&apos;s activity.</p>
                  <div className="mt-6 space-y-4">
                    <div><div className="flex justify-between text-sm"><span>Prior contributions</span><span className="tabular-nums">{formatCurrency(model.startingBalanceTotal)}</span></div><div className="mt-2 h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-violet-400" style={{ width: `${model.startingBalanceTotal > 0 ? 100 : 0}%` }} /></div></div>
                    <div><div className="flex justify-between text-sm"><span>New contributions</span><span className="tabular-nums">{formatCurrency(model.totalInvested)}</span></div><div className="mt-2 h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${model.startingBalanceTotal > 0 ? Math.min(100, (model.totalInvested / model.startingBalanceTotal) * 100) : 100}%` }} /></div></div>
                  </div>
                </div>
              </section>
            </>
          )}

          {view === "detail" && (
            <section className="mt-6 rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-medium">Monthly detail</h2>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Month
                  <select
                    value={selected?.month ?? ""}
                    onChange={(event) => setSelectedMonth(Number(event.target.value))}
                    className="rounded-lg border bg-card px-3 py-2 text-foreground"
                  >
                    {model.months.map((month) => <option key={month.period} value={month.month}>{monthName(month.month)} {month.year}</option>)}
                  </select>
                </label>
              </div>
              {selected ? (
                <>
                  <div className="mt-4 divide-y">
                    {selected.accounts.map((account) => <div key={account.account} className="flex justify-between py-3 text-sm"><span>{account.account}</span><span className="tabular-nums">{formatCurrency(account.amount)}</span></div>)}
                    <div className="flex justify-between py-3 text-sm font-medium"><span>Calculated total</span><span>{formatCurrency(selected.calculatedTotal)}</span></div>
                    <div className="flex justify-between py-3 text-sm font-medium"><span>Sheet total</span><span>{formatCurrency(selected.providedTotal)}</span></div>
                  </div>
                  {selected.startingBalances.length > 0 && (
                    <div className="mt-5 rounded-lg border border-dashed p-4">
                      <p className="text-xs font-medium text-muted-foreground">Prior contributions · excluded from current-year totals</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {selected.startingBalances.map((account) => (
                          <div key={account.account} className="flex justify-between gap-4">
                            <span>{account.account}</span>
                            <span className="tabular-nums">{formatCurrency(account.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!selected.totalMatchesAccounts && <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">The sheet total differs from the account values. Review source row {selected.location.rowNumber}.</p>}
                </>
              ) : <p className="mt-4 text-sm text-muted-foreground">No monthly records are available.</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
