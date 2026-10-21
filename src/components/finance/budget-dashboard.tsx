"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildBudgetAllocations,
  buildBudgetBenefitEstimates,
  buildBudgetMetrics,
  budgetLineWithCategory,
  defaultBudgetBenefitAssumptions,
  layoutBudgetFlowNodes,
  type BudgetAllocations,
  type BudgetBenefitAssumptions,
} from "@/lib/finance/budget-model";
import type { BudgetData } from "@/lib/finance/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const allocationDetails: Record<keyof BudgetAllocations, { label: string; detail: string; color: string }> = {
  income: { label: "Income", detail: "Take-home pay", color: "#38bdf8" },
  taxes: { label: "Taxes", detail: "Income taxes and payroll deductions", color: "#f59e0b" },
  investing: { label: "Investing", detail: "401(k), ESPP, Roth IRA + brokerage; match estimated below", color: "#34d399" },
  fun: { label: "Fun", detail: "Dining, hobbies, and discretionary spending", color: "#f472b6" },
  savings: { label: "Savings", detail: "Cash savings and short-term goals", color: "#a3e635" },
  living: { label: "Living", detail: "Internet, rent, fees, trash", color: "#a78bfa" },
  car: { label: "Car", detail: "Maintenance + gas", color: "#fb923c" },
  groceries: { label: "Groceries", detail: "Food at home", color: "#2dd4bf" },
};

const allocationKeys = Object.keys(allocationDetails) as Array<keyof BudgetAllocations>;

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function ScenarioInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  suffix: string;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(String(Math.round(value * 100) / 100));
    }
  }, [value]);

  const commit = () => {
    const numValue = Math.max(0, Number(draft) || 0);
    onChange(numValue);
    setDraft(String(Math.round(numValue * 100) / 100));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        aria-label={`${label} scenario value`}
        className="w-28 rounded-lg border bg-background px-2 py-2 text-right tabular-nums outline-none focus:border-foreground/50 transition-colors"
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            inputRef.current?.blur();
          }
        }}
      />
      <span className="w-12 text-xs text-muted-foreground">{suffix}</span>
    </div>
  );
}

export function BudgetDashboard({ data }: { data: BudgetData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [annual, setAnnual] = useState(searchParams.get("view") === "annual");
  const [benefitAssumptions, setBenefitAssumptions] = useState<BudgetBenefitAssumptions>(defaultBudgetBenefitAssumptions);
  const [allocations, setAllocations] = useState<BudgetAllocations>(() => {
    const defaults = buildBudgetAllocations(data.lines);
    const encoded = searchParams.get("v");
    if (!encoded) return defaults;
    try {
      const values: unknown = JSON.parse(encoded);
      if (Array.isArray(values) && values.length === data.lines.length) {
        const scenarioLines = data.lines.map((line, index) =>
          budgetLineWithCategory(line, line.category, Math.max(0, Number(values[index]) || 0))
        );
        return buildBudgetAllocations(scenarioLines);
      }
      if (typeof values === "object" && values !== null) {
        return Object.fromEntries(allocationKeys.map((key) => {
          const amount = (values as Record<string, unknown>)[key];
          return [key, typeof amount === "number" && Number.isFinite(amount) ? Math.max(0, amount) : defaults[key]];
        })) as BudgetAllocations;
      }
      return defaults;
    } catch {
      return defaults;
    }
  });

  const updateUrl = (nextAllocations: BudgetAllocations, nextAnnual = annual) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("v", JSON.stringify(Object.fromEntries(allocationKeys.map((key) => [key, Math.round(nextAllocations[key] * 100) / 100]))));
    params.set("view", nextAnnual ? "annual" : "monthly");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const metrics = buildBudgetMetrics(allocations);
  const benefitEstimates = buildBudgetBenefitEstimates(data.lines, benefitAssumptions);
  const value = (monthly: number) => (annual ? monthly * 12 : monthly);
  const assigned = allocations.taxes + allocations.investing + allocations.fun + allocations.savings + allocations.living + allocations.car + allocations.groceries;
  const available = Math.max(0, metrics.freeToInvest);
  const flowNodes = [
    { key: "taxes" as const, amount: allocations.taxes },
    { key: "investing" as const, amount: allocations.investing },
    { key: "fun" as const, amount: allocations.fun },
    { key: "savings" as const, amount: allocations.savings },
    { key: "living" as const, amount: allocations.living },
    { key: "car" as const, amount: allocations.car },
    { key: "groceries" as const, amount: allocations.groceries },
    { key: "available" as const, amount: available, label: "Unassigned", detail: "Available to invest or allocate", color: "#94a3b8" },
  ].map((node) => ({
    ...node,
    label: "label" in node ? node.label : allocationDetails[node.key].label,
    detail: "detail" in node ? node.detail : allocationDetails[node.key].detail,
    color: "color" in node ? node.color : allocationDetails[node.key].color,
  }));
  const flowHeightMax = 620;
  const flowScale = flowHeightMax / Math.max(metrics.income, assigned, 1);
  const flowGap = 18;
  const chartTop = 56;
  const flowAmountTotal = flowNodes.reduce((sum, node) => sum + node.amount, 0);
  const flowLayout = layoutBudgetFlowNodes(flowNodes, flowScale, chartTop, flowGap);
  const flowTotalHeight = flowLayout.length
    ? flowLayout[flowLayout.length - 1].y + flowLayout[flowLayout.length - 1].height - chartTop
    : 0;
  const chartHeight = Math.max(860, chartTop * 2 + flowTotalHeight);
  const sourceHeight = metrics.income * flowScale;
  const sourceTop = chartTop + (flowTotalHeight - sourceHeight) / 2;
  const sourceMid = sourceTop + sourceHeight / 2;

  const reset = () => {
    setAllocations(buildBudgetAllocations(data.lines));
    setAnnual(false);
    router.replace(pathname, { scroll: false });
  };

  const updateAllocation = (key: keyof BudgetAllocations, nextValue: number) => {
    const next = { ...allocations, [key]: Math.max(0, nextValue / (annual ? 12 : 1)) };
    setAllocations(next);
    updateUrl(next);
  };

  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/finance" className="hover:text-foreground">
              Finance
            </Link>{" "}
            / Budget
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Budget</h1>
          <p className="mt-2 text-muted-foreground">A clear view of where your money goes and what remains.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !annual;
              setAnnual(next);
              updateUrl(allocations, next);
            }}
            className="rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-muted/30"
          >
            {annual ? "Annual view" : "Monthly view"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/30"
          >
            Reset to starting plan
          </button>
        </div>
      </div>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label={`${annual ? "Annual" : "Monthly"} income`} value={money.format(value(metrics.income))} />
        <Metric label="Core outflows" value={money.format(value(metrics.taxes + metrics.spending))} detail="Taxes + planned categories" />
        <Metric label={`${annual ? "Annual" : "Monthly"} investing`} value={money.format(value(metrics.investing))} />
        <Metric label={metrics.freeToInvest < 0 ? "Over budget" : "Available"} value={money.format(value(Math.abs(metrics.freeToInvest)))} detail={metrics.freeToInvest < 0 ? "Reduce or reassign planned amounts" : "To invest or allocate"} />
        <Metric label="Savings rate" value={`${Math.round(metrics.savingsRate * 100)}%`} detail="Investing + savings ÷ income" />
      </section>

      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-medium">Cash flow</h2><p className="mt-1 text-sm text-muted-foreground">Your income branches into the parts of your monthly plan.</p></div>
          <p className="text-xs text-muted-foreground">Ribbon width represents the amount</p>
        </div>
        <div className="mt-6 overflow-x-auto">
        <svg
          className="mx-auto block h-auto w-full min-w-[1000px] max-w-[1440px]"
          viewBox={`0 0 1440 ${chartHeight}`}
          role="img"
          aria-label="Sankey diagram showing income flowing to taxes, investing, fun, savings, living, car, groceries, and unassigned funds"
        >
          <text x="84" y="34" className="fill-muted-foreground text-xs font-medium uppercase tracking-[0.16em]">INCOME</text>
          <text x="1000" y="34" className="fill-muted-foreground text-xs font-medium uppercase tracking-[0.16em]">MONTHLY DESTINATIONS</text>
          <rect x="80" y={sourceTop} width="220" height={sourceHeight} rx="22" fill="#38bdf8" />
          <text x="190" y={sourceMid - 9} textAnchor="middle" className="fill-slate-950 text-lg font-semibold">Income</text>
          <text x="190" y={sourceMid + 20} textAnchor="middle" className="fill-slate-950/80 text-base tabular-nums">{money.format(value(metrics.income))}</text>
          {flowLayout.map((node, index) => {
            const { bandHeight, height, y, center } = node;
            const bandTop = center - bandHeight / 2;
            const sourceOffset = chartTop + (flowTotalHeight - flowAmountTotal * flowScale) / 2;
            const sourceY0 = sourceOffset + flowLayout.slice(0, index).reduce((sum, previous) => sum + previous.bandHeight, 0);
            const sourceY1 = sourceY0 + bandHeight;
            const curveX1 = 510;
            const curveX2 = 750;
            return (
              <g key={node.key}>
                {bandHeight > 0 && <path
                  d={`M 300 ${sourceY0} C ${curveX1} ${sourceY0}, ${curveX2} ${bandTop}, 980 ${bandTop} L 980 ${bandTop + bandHeight} C ${curveX2} ${bandTop + bandHeight}, ${curveX1} ${sourceY1}, 300 ${sourceY1} Z`}
                  fill={node.color}
                  fillOpacity="0.28"
                />}
                <rect
                  x="980"
                  y={y}
                  width="420"
                  height={height}
                  rx="14"
                  fill="#0f172a"
                  stroke={node.color}
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                  aria-label={`${node.label}: ${money.format(value(node.amount))}. ${node.detail}`}
                />
                <rect x="980" y={y} width="7" height={height} rx="3.5" fill={node.color} />
                <text x="1010" y={center - 5} className="fill-foreground text-base font-semibold">{node.label}</text>
                <text x="1380" y={center - 5} textAnchor="end" className="fill-foreground text-base font-semibold tabular-nums">{money.format(value(node.amount))}</text>
                <text x="1010" y={center + 18} className="fill-muted-foreground text-xs">{node.detail}</text>
              </g>
            );
          })}
          {metrics.freeToInvest < 0 && <text x="80" y={chartHeight - 20} className="fill-rose-300 text-sm font-medium">Overallocated by {money.format(value(Math.abs(metrics.freeToInvest)))}</text>}
        </svg>
        </div>
      </section>

      <details className="mt-6 rounded-xl border bg-card">
        <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-medium">Workplace investing benefits</h2><p className="mt-1 text-sm text-muted-foreground">Estimate the value of your 401(k) match and ESPP discount.</p></div>
            <span className="text-sm text-cyan-300">View estimates</span>
          </div>
        </summary>
        <div className="border-t px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-medium">401(k) employer match</h3><p className="mt-1 text-xs text-muted-foreground">Maximum match as a share of eligible pay</p></div>
                <ScenarioInput label="401(k) match rate" value={benefitAssumptions.employerMatchPercent} suffix="%" onChange={(percent) => setBenefitAssumptions((current) => ({ ...current, employerMatchPercent: Math.min(100, percent) }))} />
              </div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">{money.format(benefitEstimates.annualEmployerMatch)}<span className="ml-1 text-sm font-normal text-muted-foreground">/yr estimated</span></p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Based on {money.format(benefitEstimates.eligibleAnnualPay)} eligible annual pay and {money.format(benefitEstimates.annualEmployee401k)} annual employee contributions. Assumes you contribute enough to receive the full match.</p>
            </div>
            <div className="rounded-lg border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-medium">ESPP purchase discount</h3><p className="mt-1 text-xs text-muted-foreground">Estimated value of shares bought below market price</p></div>
                <ScenarioInput label="ESPP discount" value={benefitAssumptions.esppDiscountPercent} suffix="%" onChange={(percent) => setBenefitAssumptions((current) => ({ ...current, esppDiscountPercent: Math.min(99, percent) }))} />
              </div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">{money.format(benefitEstimates.annualEsppDiscountValue)}<span className="ml-1 text-sm font-normal text-muted-foreground">/yr estimated</span></p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Estimated discount value on {money.format(benefitEstimates.annualEsppContribution)} in annual ESPP purchases, assuming the discount is applied to market price.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/10 p-4">
            <div><h3 className="font-medium">Roth IRA</h3><p className="mt-1 text-xs text-muted-foreground">Included as a planning status, separate from workplace-plan estimates.</p></div>
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={benefitAssumptions.rothIraMaxed} onChange={(event) => setBenefitAssumptions((current) => ({ ...current, rothIraMaxed: event.target.checked }))} className="h-4 w-4 accent-cyan-400" />Maxed for the year</label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Estimates use the starting budget’s pay-period amounts, not edited scenario categories. They are separate from cash available to allocate and are not added to the Sankey totals.</p>
        </div>
      </details>

      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Plan your cash flow</h2>
            <p className="mt-1 text-sm text-muted-foreground">Adjust broad monthly categories. Your changes only affect this scenario.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {allocationKeys.map((key) => {
            const category = allocationDetails[key];
            return (
              <div key={key} className="rounded-xl border bg-muted/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                  <h3 className="font-medium">{category.label}</h3>
                </div>
                <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{category.detail}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{annual ? "Annual" : "Monthly"}</span>
                  <ScenarioInput
                    label={category.label}
                    value={value(allocations[key])}
                    suffix={annual ? "/yr" : "/mo"}
                    onChange={(amount) => updateAllocation(key, amount)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          className="rounded-lg border px-3 py-2 hover:border-foreground/40 transition-colors"
          href={`/finance/fire?s=${Math.round((allocations.fun + allocations.living + allocations.car + allocations.groceries) * 12)}&c=${Math.round(allocations.investing * 12)}`}
        >
          Use these values in FIRE →
        </Link>
        <Link className="rounded-lg border px-3 py-2 hover:border-foreground/40 transition-colors" href="/finance">
          Back to Finance
        </Link>
      </div>

      {data.issues.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h2 className="font-medium text-amber-200">Budget data needs attention</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {data.issues.map((issue, index) => (
              <li key={`${issue.rowNumber}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 pb-8 text-xs text-muted-foreground">
        Scenario state is encoded in this URL so it can be shared. Your edits do not change the underlying budget data.
      </p>
    </div>
  );
}
