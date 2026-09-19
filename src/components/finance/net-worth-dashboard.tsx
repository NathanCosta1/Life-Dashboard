"use client";

import type { NetWorthDashboardModel } from "@/lib/finance";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatCurrency(value: number | null) {
  return value === null ? "—" : currency.format(value);
}

export function NetWorthDashboard({ model }: { model: NetWorthDashboardModel }) {
  const max = Math.max(...model.points.map((point) => point.netWorth), 1);
  const chartWidth = 760;
  const chartHeight = 300;
  const chartTop = 24;
  const chartBottom = 244;
  const chartLeft = 48;
  const chartRight = 728;
  const xStep = model.points.length > 1 ? (chartRight - chartLeft) / (model.points.length - 1) : 0;
  const pointCoordinates = model.points.map((point, index) => ({
    ...point,
    x: model.points.length > 1 ? chartLeft + index * xStep : (chartLeft + chartRight) / 2,
    y: chartBottom - (point.netWorth / max) * (chartBottom - chartTop),
  }));
  const linePath = pointCoordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = pointCoordinates.length
    ? `${linePath} L ${pointCoordinates.at(-1)?.x} ${chartBottom} L ${pointCoordinates[0].x} ${chartBottom} Z`
    : "";
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Finance / Net worth</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Net worth</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Historical net-worth values from the verified source block.</p>
      {model.latest ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Latest net worth</p><p className="mt-3 text-3xl font-semibold tabular-nums">{formatCurrency(model.latest.netWorth)}</p><p className="mt-1 text-xs text-muted-foreground">{model.latest.year}</p></div>
            <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Since prior record</p><p className="mt-3 text-3xl font-semibold tabular-nums">{formatCurrency(model.change)}</p><p className="mt-1 text-xs text-muted-foreground">Difference between consecutive recorded years</p></div>
          </div>
          <section className="mt-6 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between"><h2 className="font-medium">Historical trend</h2><span className="text-sm text-muted-foreground">{model.points.length} records</span></div>
            <div className="mt-5 overflow-x-auto">
              <svg className="block min-w-[620px] w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Historical net worth trend">
                <defs>
                  <linearGradient id="net-worth-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartBottom - ratio * (chartBottom - chartTop);
                  return <line key={ratio} x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="currentColor" strokeDasharray="3 6" className="text-border" />;
                })}
                {areaPath && <path d={areaPath} fill="url(#net-worth-area)" />}
                {linePath && <path d={linePath} fill="none" stroke="#22d3ee" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />}
                {pointCoordinates.map((point) => (
                  <g key={point.year}>
                    <circle cx={point.x} cy={point.y} r="9" fill="currentColor" className="text-card" />
                    <circle cx={point.x} cy={point.y} r="5" fill="#22d3ee" />
                    <text x={point.x} y={point.y - 16} textAnchor="middle" className="fill-muted-foreground text-[11px]">{formatCurrency(point.netWorth)}</text>
                    <text x={point.x} y="274" textAnchor="middle" className="fill-muted-foreground text-[11px]">{point.year}</text>
                  </g>
                ))}
              </svg>
            </div>
          </section>
        </>
      ) : <div className="mt-8 rounded-xl border border-dashed bg-card p-8"><p className="font-medium">No net-worth records are available.</p><p className="mt-2 text-sm text-muted-foreground">The verified Net Worth block does not contain usable records yet.</p></div>}
    </div>
  );
}
