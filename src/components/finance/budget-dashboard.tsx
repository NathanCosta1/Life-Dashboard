"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildBudgetMetrics, budgetLineWithCategory } from "@/lib/finance/budget-model";
import type { BudgetData, BudgetLine } from "@/lib/finance/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const labels: Record<string, string> = { income: "Income", tax: "Taxes", housing: "Core living", transportation: "Core living", food: "Core living", household: "Core living", subscriptions: "Core living", "flexible-spending": "Flexible spending", "retirement-investing": "Retirement investing", "other-investing": "Other investing", unknown: "Unclassified" };

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
}

export function BudgetDashboard({ data }: { data: BudgetData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [annual, setAnnual] = useState(searchParams.get("view") === "annual");
  const [lines, setLines] = useState(() => {
    const encoded = searchParams.get("v");
    if (!encoded) return data.lines;
    try {
      const values = JSON.parse(encoded) as number[];
      return values.length === data.lines.length ? data.lines.map((line, index) => budgetLineWithCategory(line, line.category, Math.max(0, Number(values[index]) || 0))) : data.lines;
    } catch { return data.lines; }
  });
  const updateUrl = (nextLines: BudgetLine[], nextAnnual = annual) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("v", JSON.stringify(nextLines.map((line) => Math.round(line.monthly * 100) / 100)));
    params.set("view", nextAnnual ? "annual" : "monthly");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const metrics = buildBudgetMetrics(lines);
  const value = (monthly: number) => annual ? monthly * 12 : monthly;
  const fun = lines.filter((line) => line.category === "flexible-spending").reduce((sum, line) => sum + line.monthly, 0);
  const living = Math.max(0, metrics.spending - fun);
  const flowNodes = [
    { label: "Taxes", amount: metrics.taxes, color: "#f59e0b" },
    { label: "Living", amount: living, color: "#a78bfa" },
    { label: "Fun", amount: fun, color: "#f472b6" },
    { label: "Investing", amount: metrics.investing, color: "#34d399" },
    { label: "Available", amount: Math.max(0, metrics.freeToInvest), color: "#94a3b8" },
  ];
  const flowScale = Math.max(metrics.income, 1);
  const flowHeight = (amount: number) => Math.max(amount > 0 ? 18 : 0, 150 * amount / flowScale);
  const flowGap = 12;
  const flowTotalHeight = flowNodes.reduce((sum, node) => sum + flowHeight(node.amount), 0) + flowGap * (flowNodes.length - 1);
  const reset = () => { setLines(data.lines); router.replace(pathname, { scroll: false }); };
  return <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground"><Link href="/finance" className="hover:text-foreground">Finance</Link> / Budget</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Budget</h1><p className="mt-2 text-muted-foreground">Nathan-only interactive monthly cash-flow plan.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => { const next = !annual; setAnnual(next); updateUrl(lines, next); }} className="rounded-lg border px-3 py-2 text-sm">{annual ? "Annual view" : "Monthly view"}</button><button type="button" onClick={reset} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Reset to sheet values</button></div></div>
    <p className="mt-4 text-xs text-muted-foreground">Source: {data.source.tab} tab · {data.source.frequency === "biweekly" ? "biweekly pay period" : data.source.frequency} · Planning view: {annual ? "annual equivalent" : "monthly equivalent"}</p>
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Monthly income" value={money.format(value(metrics.income))} /><Metric label="Core outflows" value={money.format(value(metrics.taxes + metrics.spending))} detail="Taxes + living expenses" /><Metric label="Monthly investing" value={money.format(value(metrics.investing))} /><Metric label="Free to invest" value={money.format(value(metrics.freeToInvest))} /><Metric label="Savings rate" value={`${Math.round(metrics.savingsRate * 100)}%`} detail="Investing ÷ income" /></section>
    <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6"><h2 className="font-medium">Cash flow</h2><p className="mt-1 text-sm text-muted-foreground">Income branches into each monthly destination.</p><svg className="mt-5 block h-auto w-full" viewBox="0 0 900 220" role="img" aria-label="Sankey diagram showing income flowing to taxes, living, fun, investing, and available cash"><rect x="40" y="35" width="130" height="150" rx="10" fill="#22d3ee" opacity="0.85" /><text x="105" y="105" textAnchor="middle" className="fill-background text-sm font-medium">Income</text><text x="105" y="125" textAnchor="middle" className="fill-background text-xs">{money.format(value(metrics.income))}</text>{flowNodes.map((node, index) => { const height = flowHeight(node.amount); const y = (220 - flowTotalHeight) / 2 + flowNodes.slice(0, index).reduce((sum, previous) => sum + flowHeight(previous.amount) + flowGap, 0); const center = y + height / 2; return <g key={node.label}><path d={`M 170 ${105 + (center - 105) * 0.15} C 340 ${105 + (center - 105) * 0.15}, 450 ${center}, 650 ${center}`} fill="none" stroke={node.color} strokeWidth={Math.max(2, height)} opacity="0.35" /><rect x="650" y={y} width="150" height={height} rx="8" fill={node.color} opacity="0.85" aria-label={`${node.label}: ${money.format(value(node.amount))}`} /><text x="725" y={center - 4} textAnchor="middle" className="fill-background text-xs font-medium">{node.label}</text><text x="725" y={center + 12} textAnchor="middle" className="fill-background text-[11px]">{money.format(value(node.amount))}</text></g>; })}</svg></section>
    <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-medium">Scenario values</h2><p className="mt-1 text-sm text-muted-foreground">Edit locally; changes never write to Google Sheets.</p></div><span className="text-xs text-muted-foreground">{lines.length} lines</span></div><div className="mt-4 divide-y">{lines.map((line, index) => <div key={`${line.rowNumber}-${line.label}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="min-w-48 text-sm">{line.label}<span className="block text-xs text-muted-foreground">{labels[line.category] ?? line.category}</span></span><span className="flex flex-wrap items-center justify-end gap-2"><span className="text-xs text-muted-foreground">{line.frequency}</span><input aria-label={`${line.label} scenario value`} className="w-28 rounded-lg border bg-background px-2 py-2 text-right tabular-nums" type="number" min="0" step="0.01" value={Math.round(value(line.monthly) * 100) / 100} onChange={(event) => { const monthly = Math.max(0, Number(event.target.value) || 0) / (annual ? 12 : 1); const next = lines.map((item, itemIndex) => itemIndex === index ? budgetLineWithCategory(item, item.category, monthly) : item); setLines(next); updateUrl(next); }} /><span className="w-12 text-xs text-muted-foreground">{annual ? "/yr" : "/mo"}</span></span></div>)}</div></section>
    <div className="mt-6 flex flex-wrap gap-3 text-sm"><Link className="rounded-lg border px-3 py-2 hover:border-foreground/40" href={`/finance/fire?s=${Math.round(metrics.spending * 12)}&c=${Math.round(metrics.investing * 12)}`}>Use these values in FIRE →</Link><Link className="rounded-lg border px-3 py-2 hover:border-foreground/40" href="/finance">Back to Finance</Link></div>
    {data.issues.length > 0 && <section className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4"><h2 className="font-medium text-amber-200">Source diagnostics</h2><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{data.issues.map((issue, index) => <li key={`${issue.rowNumber}-${index}`}>Row {issue.rowNumber}: {issue.message}{issue.value ? ` (${issue.value})` : ""}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Only Nathan rows from Planned are included; Maddy is intentionally ignored.</p></section>}
    <p className="mt-6 pb-8 text-xs text-muted-foreground">Scenario state is encoded in this URL so it can be shared. The source values remain read-only.</p>
  </div>;
}
