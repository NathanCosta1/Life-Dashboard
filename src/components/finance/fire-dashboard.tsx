"use client";

import { useEffect, useRef, useState } from "react";
import { useMemo } from "react";
import { calculateFire, getProjectionLabelIndexes, type FireDashboardModel, type FireInputs } from "@/lib/finance/fire-model";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

function money(value: number) {
  return currency.format(Math.max(0, value));
}

function progress(value: number) {
  return percent.format(Math.min(1, Math.max(0, value)));
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function InputField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (value: number) => void; suffix?: string }) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(String(Math.round(value * 100) / 100));
  }, [value]);

  const commit = () => onChange(Number(draft) || 0);
  return <label className="flex min-w-0 flex-col"><span className="flex min-h-10 items-end text-sm leading-5 text-muted-foreground">{label}</span><span className="mt-2 flex h-10 items-center rounded-lg border bg-background px-3 focus-within:border-foreground/50"><input ref={inputRef} className="min-w-0 flex-1 bg-transparent py-2 text-right tabular-nums outline-none" type="text" inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); inputRef.current?.blur(); } }} />{suffix && <span className="pl-2 text-sm text-muted-foreground">{suffix}</span>}</span></label>;
}

function ProjectionChart({ projection, lowerProjection, upperProjection, contributionProjection, fiNumber, fireYear, markerYear, markerLabel = "FI", realReturnPercent, ariaLabel, showRange = true }: {
  projection: ReturnType<typeof calculateFire>["projection"];
  lowerProjection: ReturnType<typeof calculateFire>["lowerProjection"];
  upperProjection: ReturnType<typeof calculateFire>["upperProjection"];
  contributionProjection?: ReturnType<typeof calculateFire>["coastContributionProjection"];
  fiNumber: number;
  fireYear: number | null;
  markerYear?: number | null;
  markerLabel?: string;
  realReturnPercent: number;
  ariaLabel?: string;
  showRange?: boolean;
}) {
  const [hovered, setHovered] = useState<{ index: number; series: "base" | "lower" | "upper" | "contributions"; x: number; y: number } | null>(null);
  const width = 760;
  const height = 280;
  const chartLeft = 82;
  const chartRight = 730;
  const chartTop = 24;
  const chartBottom = 222;
  const fireIndex = fireYear === null ? -1 : projection.findIndex((point) => point.year === fireYear);
  const markerIndex = markerYear === null || markerYear === undefined ? -1 : projection.findIndex((point) => point.year === markerYear);
  const visibleLength = Math.min(projection.length, Math.max(Math.max(fireIndex, markerIndex) >= 0 ? Math.max(fireIndex, markerIndex) + 11 : 16, 16));
  const visibleProjection = projection.slice(0, visibleLength);
  const visibleLowerProjection = lowerProjection.slice(0, visibleLength);
  const visibleUpperProjection = upperProjection.slice(0, visibleLength);
  const visibleContributionProjection = contributionProjection?.slice(0, visibleLength);
  const max = Math.max(fiNumber, ...visibleUpperProjection.map((point) => point.portfolio), 1);
  const x = (index: number) => chartLeft + (index / Math.max(visibleProjection.length - 1, 1)) * (chartRight - chartLeft);
  const y = (value: number) => chartBottom - (value / max) * (chartBottom - chartTop);
  const line = visibleProjection.map((point, index) => `${x(index)},${y(point.portfolio)}`).join(" ");
  const lowerLine = visibleLowerProjection.map((point, index) => `${x(index)},${y(point.portfolio)}`).join(" ");
  const upperLine = visibleUpperProjection.map((point, index) => `${x(index)},${y(point.portfolio)}`).join(" ");
  const contributionLine = visibleContributionProjection?.map((point, index) => `${x(index)},${y(point.portfolio)}`).join(" ");
  const yearLabels = getProjectionLabelIndexes(visibleProjection.length).map((index) => ({ point: visibleProjection[index], index }));
  const yStep = max >= 1000000 ? 500000 : max >= 500000 ? 250000 : 100000;
  const yLabels = Array.from({ length: Math.floor(max / yStep) + 1 }, (_, index) => index * yStep);

  return <div className="overflow-x-auto"><div className="relative min-w-[640px]"><svg className="block w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel ?? "Projected portfolio growth toward financial independence"}>
    <line x1={chartLeft} x2={chartRight} y1={y(fiNumber)} y2={y(fiNumber)} stroke="#fbbf24" strokeDasharray="6 5" aria-label={`FI target: ${money(fiNumber)} based on annual spending and withdrawal rate`} />
    <text x={chartRight} y={y(fiNumber) - 8} textAnchor="end" className="fill-amber-300 text-[11px]">FI target</text>
    <line x1={chartLeft} x2={chartRight} y1={chartBottom} y2={chartBottom} stroke="currentColor" className="text-border" />
    <line x1={chartLeft} x2={chartLeft} y1={chartTop} y2={chartBottom} stroke="currentColor" className="text-border" />
    {yLabels.map((value) => <g key={value}><line x1={chartLeft} x2={chartRight} y1={y(value)} y2={y(value)} stroke="currentColor" className="text-border/40" strokeDasharray="2 5" /><text x={chartLeft - 8} y={y(value) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{money(value)}</text></g>)}
    {showRange && <polyline points={lowerLine} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" aria-label={`Lower return path: ${realReturnPercent - 2}% real return`} />}
    {showRange && <polyline points={upperLine} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" aria-label={`Higher return path: ${realReturnPercent + 2}% real return`} />}
    <polyline points={line} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {contributionLine && <polyline points={contributionLine} fill="none" stroke="#67e8f9" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.9" aria-label="Cumulative contributions" />}
    {yearLabels.map(({ point, index }) => {
      return <g key={point.year}><circle cx={x(index)} cy={y(point.portfolio)} r="4" fill="#22d3ee" /><text x={x(index)} y={chartBottom + 22} textAnchor="middle" className="fill-muted-foreground text-[10px]">{point.year}</text></g>;
    })}
    {markerIndex >= 0 && <g><line x1={x(markerIndex)} x2={x(markerIndex)} y1={chartTop} y2={chartBottom} stroke="#fbbf24" strokeDasharray="5 5" /><circle cx={x(markerIndex)} cy={y(projection[markerIndex].portfolio)} r="7" fill="none" stroke="#fbbf24" strokeWidth="2" /><text x={x(markerIndex)} y={chartTop - 6} textAnchor="middle" className="fill-amber-300 text-[11px]">{markerLabel}</text></g>}
    {visibleProjection.map((point, index) => <circle
      key={`hover-${point.year}`}
      cx={x(index)}
      cy={y(point.portfolio)}
      r="15"
      fill="transparent"
      className="cursor-crosshair"
      onMouseEnter={() => setHovered({ index, series: "base", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })}
      onFocus={() => setHovered({ index, series: "base", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })}
      onMouseLeave={() => setHovered(null)}
      onBlur={() => setHovered(null)}
      tabIndex={0}
      aria-label={`${point.year}: ${money(point.portfolio)} base projection`}
    />)}
    {showRange && visibleLowerProjection.slice(1).map((point, offset) => {
      const index = offset + 1;
      return <circle key={`hover-lower-${point.year}`} cx={x(index)} cy={y(point.portfolio)} r="10" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHovered({ index, series: "lower", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })} onFocus={() => setHovered({ index, series: "lower", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })} onMouseLeave={() => setHovered(null)} onBlur={() => setHovered(null)} tabIndex={0} aria-label={`${point.year}: ${money(point.portfolio)} lower-return projection`} />;
    })}
    {showRange && visibleUpperProjection.slice(1).map((point, offset) => {
      const index = offset + 1;
      return <circle key={`hover-upper-${point.year}`} cx={x(index)} cy={y(point.portfolio)} r="10" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHovered({ index, series: "upper", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })} onFocus={() => setHovered({ index, series: "upper", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })} onMouseLeave={() => setHovered(null)} onBlur={() => setHovered(null)} tabIndex={0} aria-label={`${point.year}: ${money(point.portfolio)} higher-return projection`} />;
    })}
    {visibleContributionProjection?.slice(1).map((point, offset) => {
      const index = offset + 1;
      return <circle key={`hover-contributions-${point.year}`} cx={x(index)} cy={y(point.portfolio)} r="12" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHovered({ index, series: "contributions", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })} onFocus={() => setHovered({ index, series: "contributions", x: (x(index) / width) * 100, y: (y(point.portfolio) / height) * 100 })} onMouseLeave={() => setHovered(null)} onBlur={() => setHovered(null)} tabIndex={0} aria-label={`${point.year}: ${money(point.portfolio)} cumulative contributions`} />;
    })}
  </svg>
  {hovered && (
    <div
      className="pointer-events-none absolute z-10 w-52 rounded-lg border bg-background/95 p-3 text-xs shadow-xl backdrop-blur-sm"
      role="status"
      style={{
        left: `${hovered.x}%`,
        top: `${hovered.y}%`,
        transform: hovered.x > 72 ? "translate(-105%, -50%)" : "translate(5%, -50%)",
      }}
    >
      <p className="text-sm">{visibleProjection[hovered.index].year}</p>
      <div className="mt-2 space-y-1">
        <p className="flex justify-between gap-3 text-xs"><span className="text-cyan-300">Base</span><span className="tabular-nums">{money(visibleProjection[hovered.index].portfolio)}</span></p>
        {showRange && <><p className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">Lower return</span><span className="tabular-nums">{money(visibleLowerProjection[hovered.index].portfolio)}</span></p><p className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">Higher return</span><span className="tabular-nums">{money(visibleUpperProjection[hovered.index].portfolio)}</span></p></>}
        {visibleContributionProjection && <p className="flex justify-between gap-3 text-xs"><span className="text-cyan-300">Contributions</span><span className="tabular-nums">{money(visibleContributionProjection[hovered.index].portfolio)}</span></p>}
      </div>
    </div>
  )}
  </div></div>;
}

export function FireDashboard({ model }: { model: FireDashboardModel }) {
  const [inputs, setInputs] = useState<FireInputs>(model.defaults);
  const [contributionsGrow, setContributionsGrow] = useState(false);
  const [showMonthlyValues, setShowMonthlyValues] = useState(false);
  const [retirementPlanningEnabled, setRetirementPlanningEnabled] = useState(true);
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const result = useMemo(() => calculateFire(inputs, model.asOfYear, contributionsGrow ? 3 : 0), [inputs, model.asOfYear, contributionsGrow]);
  const scenarios = useMemo(() => [
    { label: "Spend $5K less", detail: "Annual spending", result: calculateFire({ ...inputs, annualSpending: Math.max(0, inputs.annualSpending - 5000) }, model.asOfYear), isBarista: false, isCoast: false },
    { label: "Spend $10K more in retirement", detail: "Retirement spending only", result: calculateFire({ ...inputs, annualSpending: inputs.annualSpending + 10000 }, model.asOfYear), isBarista: false, isCoast: false },
    { label: "Invest $1K more/mo", detail: "Annual contributions", result: calculateFire({ ...inputs, annualContributions: inputs.annualContributions + 12000 }, model.asOfYear), isBarista: false, isCoast: false },
    { label: "Invest $1K less/mo", detail: "Annual contributions", result: calculateFire({ ...inputs, annualContributions: Math.max(0, inputs.annualContributions - 12000) }, model.asOfYear), isBarista: false, isCoast: false },
    {
      label: "Barista FI: $10K/yr side income",
      detail: `Target reduction: ${money(10000 / (inputs.withdrawalRatePercent / 100))}`,
      result: calculateFire({ ...inputs, annualSpending: Math.max(0, inputs.annualSpending - 10000) }, model.asOfYear),
      isBarista: true,
      isCoast: false,
    },
    { label: "Coast Today: $0 future contributions", detail: "Starting portfolio compounds on its own", result: calculateFire({ ...inputs, annualContributions: 0 }, model.asOfYear), isBarista: false, isCoast: true },
  ], [inputs, model.asOfYear]);
  const currentAge = useMemo(() => {
    return model.currentAge;
  }, [model.currentAge]);
  const update = (key: keyof FireInputs) => (value: number) => setInputs((current) => ({ ...current, [key]: value }));
  const updateRetirementYears = (years: number) => setInputs((current) => ({ ...current, yearsToRetirement: years, retirementAge: currentAge + years }));
  const updateRetirementAge = (age: number) => setInputs((current) => ({ ...current, retirementAge: age, yearsToRetirement: Math.max(0, age - currentAge) }));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const numberParam = (key: string, fallback: number) => {
      const value = Number(params.get(key));
      return Number.isFinite(value) ? value : fallback;
    };
    const hasScenario = ["p", "s", "c", "r", "w", "y", "a", "g", "m", "t"].some((key) => params.has(key));
    const timeout = window.setTimeout(() => {
      if (hasScenario) {
        setInputs({
          startingPortfolio: numberParam("p", model.defaults.startingPortfolio),
          annualSpending: numberParam("s", model.defaults.annualSpending),
          annualContributions: numberParam("c", model.defaults.annualContributions),
          realReturnPercent: numberParam("r", model.defaults.realReturnPercent),
          withdrawalRatePercent: numberParam("w", model.defaults.withdrawalRatePercent),
          yearsToRetirement: numberParam("y", model.defaults.yearsToRetirement),
          retirementAge: numberParam("a", model.defaults.retirementAge),
        });
        setContributionsGrow(params.get("g") === "1");
        setShowMonthlyValues(params.get("m") === "1");
        setRetirementPlanningEnabled(params.get("t") !== "0");
      }
      setUrlInitialized(true);
      setShareUrl(window.location.href);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [model.defaults]);
  useEffect(() => {
    if (!urlInitialized) return;
    const params = new URLSearchParams();
    const defaults = model.defaults;
    const values: Array<[string, number, number]> = [
      ["p", inputs.startingPortfolio, defaults.startingPortfolio],
      ["s", inputs.annualSpending, defaults.annualSpending],
      ["c", inputs.annualContributions, defaults.annualContributions],
      ["r", inputs.realReturnPercent, defaults.realReturnPercent],
      ["w", inputs.withdrawalRatePercent, defaults.withdrawalRatePercent],
      ["y", inputs.yearsToRetirement, defaults.yearsToRetirement],
      ["a", inputs.retirementAge, defaults.retirementAge],
    ];
    values.forEach(([key, value, defaultValue]) => {
      if (value !== defaultValue) params.set(key, String(value));
    });
    if (contributionsGrow) params.set("g", "1");
    if (showMonthlyValues) params.set("m", "1");
    if (!retirementPlanningEnabled) params.set("t", "0");
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
    const timeout = window.setTimeout(() => setShareUrl(window.location.href), 0);
    return () => window.clearTimeout(timeout);
  }, [contributionsGrow, inputs, retirementPlanningEnabled, showMonthlyValues, urlInitialized]);
  const workingMonthFreedom = inputs.annualSpending > 0 ? (inputs.annualContributions / 12) / (inputs.annualSpending / 12) : 0;
  const sourceParts = [
    model.sourceSummary.portfolioYear && `portfolio ${model.sourceSummary.portfolioYear}`,
    model.sourceSummary.contributionYear && `contributions ${model.sourceSummary.contributionYear}`,
  ].filter(Boolean);

  return <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
    <p className="text-sm font-medium text-muted-foreground">Finance / FIRE calculator</p>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="mt-2 text-3xl font-semibold tracking-tight">FIRE calculator</h1><p className="mt-2 max-w-2xl text-muted-foreground">Model Coast FI and financial independence milestones with adjustable assumptions.</p></div>
      {retirementPlanningEnabled && <div className={`rounded-full px-3 py-1.5 text-sm font-medium ${result.retirementSupportsFi ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>{result.retirementSupportsFi ? "On track for FI by retirement" : "Not on track for FI by retirement"}</div>}
      <button type="button" onClick={() => { setInputs(model.defaults); setContributionsGrow(false); setShowMonthlyValues(false); setRetirementPlanningEnabled(true); }} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">Reset dashboard values</button>
    </div>

    <section className="mt-8 grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Your assumptions</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">These stay local to this calculator and never change your source sheets.</p>
        <div className="mt-5 space-y-4">
          <InputField label="Investable portfolio" value={inputs.startingPortfolio} onChange={update("startingPortfolio")} />
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Cash flow assumptions</p><div className="flex rounded-lg border bg-muted/30 p-0.5 text-xs">{["Annual", "Monthly"].map((period) => <button key={period} type="button" onClick={() => setShowMonthlyValues(period === "Monthly")} className={`rounded-md px-2.5 py-1 transition-colors ${showMonthlyValues === (period === "Monthly") ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{period}</button>)}</div></div>
          <InputField label={`${showMonthlyValues ? "Monthly" : "Annual"} spending`} value={showMonthlyValues ? inputs.annualSpending / 12 : inputs.annualSpending} onChange={(value) => update("annualSpending")(showMonthlyValues ? value * 12 : value)} />
          <InputField label={`${showMonthlyValues ? "Monthly" : "Annual"} contributions`} value={showMonthlyValues ? inputs.annualContributions / 12 : inputs.annualContributions} onChange={(value) => update("annualContributions")(showMonthlyValues ? value * 12 : value)} />
          <InputField label="Real return" value={inputs.realReturnPercent} onChange={update("realReturnPercent")} suffix="%" />
          <InputField label="Withdrawal rate" value={inputs.withdrawalRatePercent} onChange={update("withdrawalRatePercent")} suffix="%" />
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-3"><input type="checkbox" checked={retirementPlanningEnabled} onChange={(event) => setRetirementPlanningEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 accent-cyan-400" /><span><span className="block text-sm font-medium">Set a retirement target</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Adds Coast FI timing and checks whether the portfolio reaches FI by that age.</span></span></label>
          {retirementPlanningEnabled && <div className="grid grid-cols-2 gap-3">
            <InputField label="Years to retirement" value={inputs.yearsToRetirement} onChange={updateRetirementYears} />
            <InputField label="Desired retirement age" value={inputs.retirementAge} onChange={updateRetirementAge} />
          </div>}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-3">
            <input type="checkbox" checked={contributionsGrow} onChange={(event) => setContributionsGrow(event.target.checked)} className="mt-0.5 h-4 w-4 accent-cyan-400" />
            <span><span className="block text-sm font-medium">Contributions grow 3% annually</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Models raises increasing your annual investment amount each year.</span></span>
          </label>
        </div>
        <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">Age {currentAge} · Born July 25, 2003</p>
        {sourceParts.length > 0 && <p className="mt-2 text-xs leading-5 text-muted-foreground">Prefilled from dashboard data: {sourceParts.join(", ")}. Annual spending starts at a $40,000 planning baseline.</p>}
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Full FI progress" value={progress(result.fiProgress)} detail={`${money(inputs.startingPortfolio)} of ${money(result.fiNumber)} target`} />
          <MetricCard label="Coast FI progress" value={progress(result.coastProgress)} detail={`Target today: ${money(result.coastTarget)}`} />
          <MetricCard label="Portfolio-supported spending" value={money(result.supportedAnnualSpending)} detail={`At a ${inputs.withdrawalRatePercent}% withdrawal rate`} />
          <MetricCard label="Working-month freedom" value={`${workingMonthFreedom.toFixed(1)} mo`} detail="Each month of work buys approximately" />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-medium">Portfolio projection</h2><p className="mt-1 text-sm text-muted-foreground">Today&apos;s dollars using a {inputs.realReturnPercent}% real return and {money(inputs.annualContributions)} annual contributions{contributionsGrow ? ", growing 3% each year" : ""}.</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Estimated full FI</p><p className="mt-1 text-xl font-semibold tabular-nums">{result.fireYear ? `Around ${result.fireYear}` : "Beyond projection"}</p><p className="mt-1 text-xs text-muted-foreground">{result.fireYear ? `Age ${currentAge + result.fireYear - model.asOfYear}` : ""}</p></div></div>
          <div className="mt-5"><ProjectionChart projection={result.projection} lowerProjection={result.lowerProjection} upperProjection={result.upperProjection} fiNumber={result.fiNumber} fireYear={result.fireYear} markerYear={result.fireYear} realReturnPercent={inputs.realReturnPercent} /></div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-cyan-400" />Base path</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full border border-slate-400" />Range: ±2% return</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-300" />FI target: {money(result.fiNumber)}</span></div>
        </div>
      </div>
    </section>
    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">What moves the date?</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Small changes can shift the estimate. These quick scenarios use the same return and withdrawal assumptions.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {scenarios.map((scenario) => {
            return <div key={scenario.label} className="rounded-lg bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{scenario.label}</p><p className="mt-1 font-medium tabular-nums">{scenario.result.fireYear ? `FI around ${scenario.result.fireYear}` : "Beyond 50-year view"}</p><p className="mt-1 text-xs text-muted-foreground">{scenario.result.fireYear ? `Age ${currentAge + scenario.result.fireYear - model.asOfYear}` : scenario.detail}</p>{(scenario.isBarista || scenario.isCoast) && <p className="mt-1 text-xs text-muted-foreground">{scenario.detail}</p>}</div>;
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">The chart range uses real returns of {inputs.realReturnPercent - 2}% to {inputs.realReturnPercent + 2}%.</p>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Projected milestones</h2>
        <div className="mt-4 divide-y">
          {[
            ...(retirementPlanningEnabled ? [{ target: result.coastTarget, year: result.coastReachedYear, label: "Coast FI", completion: result.coastProgress }] : []),
            ...result.milestones.map((milestone) => ({ ...milestone, label: undefined, completion: inputs.startingPortfolio / milestone.target })),
            { target: result.fiNumber, year: result.fireYear, label: "Full FI", completion: result.fiProgress },
          ].sort((a, b) => a.target - b.target).map((milestone) => <div key={`${milestone.label ?? milestone.target}-${milestone.year}`} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{money(milestone.target)}{milestone.label && <span className="ml-2 text-xs font-normal text-cyan-300">{milestone.label}</span>}<span className="ml-2 text-xs font-normal text-muted-foreground">{progress(milestone.completion)} complete</span></span><span className="text-right text-muted-foreground">{milestone.year ? <><span className="font-medium text-foreground">{milestone.year}</span><span className="ml-2">age {currentAge + milestone.year - model.asOfYear}</span></> : milestone.label === "Coast FI" ? "Not reached by retirement" : "Beyond 50-year view"}</span></div>)}
        </div>
      </div>
    </section>
    {retirementPlanningEnabled && <section className="mt-6 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="font-medium">Coast FI projection</h2><p className="mt-1 text-sm text-muted-foreground">{result.coastReachedYear ? "Projected portfolio growth after contributions stop at Coast FI. The dotted line shows cumulative contributions made before that point." : "Coast FI is not reached by the selected retirement date, so contributions continue. The ordinary portfolio projection above is the relevant path."}</p></div>
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${result.coastReachedYear ? "bg-muted/40 text-muted-foreground" : "bg-amber-400/15 text-amber-300"}`}>{result.coastReachedYear ? `Contributions stop in ${result.coastReachedYear}` : "Coast FI not reached by retirement"}</div>
      </div>
      {result.coastReachedYear ? <><div className="mt-5"><ProjectionChart projection={result.coastProjection} lowerProjection={result.coastProjection} upperProjection={result.coastProjection} contributionProjection={result.coastContributionProjection} fiNumber={result.fiNumber} fireYear={null} markerYear={result.coastReachedYear} markerLabel="Coast FI" realReturnPercent={inputs.realReturnPercent} showRange={false} ariaLabel="Projected portfolio growth after Coast FI contributions stop" /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-cyan-400" />Portfolio after Coast FI</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full border border-cyan-300" />Cumulative contributions</span><span>Contributions stop in {result.coastReachedYear}; projected at retirement: {money(result.coastRetirementValue)}</span></div></> : <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">Keep contributing through {model.asOfYear + inputs.yearsToRetirement} to stay on the selected retirement path. A separate Coast FI chart is not shown because it would be the same contribution-included trajectory as the main projection.</div>}
    </section>}
    <p className="mt-6 pb-8 text-center text-xs text-muted-foreground">P.S. <a href={shareUrl || "/finance/fire"} className="underline decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-foreground">copy this link to share your current parameters</a>.</p>
  </div>;
}
