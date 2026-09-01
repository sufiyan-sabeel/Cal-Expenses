"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ExpenseService } from "@/lib/services/expense.service";
import { IncomeService } from "@/lib/services/income.service";
import { CategoryService } from "@/lib/services/category.service";
import { categoryShares, trailing90DayAvg, dailySpend, calendarHeatmapLevel, monthRangeFor } from "@/lib/calculations";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { ShareButton } from "@/components/ui/share-button";
import { todayISODate } from "@/lib/domain/common";
import { downloadPdfReport, buildAllExpensesReport, downloadBlob } from "@/lib/export";

function SkeletonChart() {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-32">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 skeleton" style={{ height: `${30 + ((i * 17) % 60)}%`, borderRadius: "var(--radius-xs)" }} />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [refresh, setRefresh] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const h = () => setRefresh((v) => v + 1);
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("focus", h);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("focus", h); };
  }, []);

  const data = useMemo(() => {
    try {
      const expenses = ExpenseService.getAll();
      const incomes = IncomeService.getAll();
      const cats = CategoryService.getAll();
      const today = todayISODate();
      const range = period === "month" ? monthRangeFor(today) : { start: `${today.slice(0, 4)}-01-01`, end: `${today.slice(0, 4)}-12-31` };
      const shares = categoryShares(expenses, range.start, range.end);
      const totalIncome = incomes.filter((i) => i.date >= range.start && i.date <= range.end).reduce((s, i) => s + i.amount, 0);
      const totalExpense = expenses.filter((e) => e.date >= range.start && e.date <= range.end).reduce((s, e) => s + e.amount, 0);
      const avg = trailing90DayAvg(today, expenses);
      const heat = Array.from({ length: 35 }, (_, i) => {
        const d = new Date(today + "T00:00:00"); d.setDate(d.getDate() - (34 - i));
        const iso = d.toISOString().slice(0, 10);
        const spend = dailySpend(iso, expenses);
        return { date: iso, spend, level: calendarHeatmapLevel(spend, avg) as number };
      });
      const daily = (() => {
        const map = new Map<string, number>();
        for (const e of expenses.filter((e) => e.date >= range.start && e.date <= range.end)) map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
        const out: { date: string; amount: number }[] = [];
        if (period === "year") {
          const monthly = new Map<string, number>();
          for (const ex of expenses.filter((ex) => ex.date >= range.start && ex.date <= range.end)) {
            const k = ex.date.slice(0, 7);
            monthly.set(k, (monthly.get(k) ?? 0) + ex.amount);
          }
          return Array.from(monthly.entries()).map(([date, amount]) => ({ date, amount }));
        }
        const s = new Date(range.start + "T00:00:00");
        const e = new Date(range.end + "T00:00:00");
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          const iso = d.toISOString().slice(0, 10);
          out.push({ date: iso, amount: map.get(iso) ?? 0 });
        }
        return out;
      })();
      setLoadError(null);
      return { expenses, incomes, cats, shares, totalIncome, totalExpense, heat, avg, range, daily, today };
    } catch (e) {
      setLoadError((e as Error).message);
      return null;
    }
  }, [period, refresh]);

  if (!mounted || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="skeleton h-7 w-24" /><div className="skeleton h-9 w-32" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0,1,2,3].map(i => <div key={i} className="skeleton h-24" style={{ borderRadius: "var(--radius-md)"}}/> )}</div>
        <SkeletonChart />
      </div>
    );
  }

  const fmt = (n: number) => `₹${n.toFixed(0)}`;
  const maxDaily = Math.max(...data.daily.map((d) => d.amount), 1);

  const handlePrint = () => {
    const { html } = buildAllExpensesReport();
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };
  const handleExportCsv = () => {
    const rows = data.daily.map((d) => ({ date: d.date, amount: d.amount }));
    const csv = ["date,amount", ...rows.map((r) => `${r.date},${r.amount}`)].join("\n");
    downloadBlob(csv, `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold tracking-tight flex items-center gap-2" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}><Icon name="analytics" size={22} /> Analytics</h1>
          <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Spending, income and savings — readable on mobile, detailed on desktop.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "month" | "year")}
            className="h-11 px-3 text-sm border bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--color-border)", minHeight: 44 }}
            aria-label="Period"
          >
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>
          <Button variant="secondary" size="sm" onClick={handlePrint} style={{ minHeight: 44 }}><Icon name="receipt" size={14} /> <span className="hidden sm:inline ml-1">Print</span></Button>
          <ShareButton title="CAL-EXPENSES Analytics" text={`Income ${fmt(data.totalIncome)} Expenses ${fmt(data.totalExpense)}`} />
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 border p-3" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium">We couldn&apos;t load analytics: {loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => setRefresh(v => v+1)}>Retry</Button>
        </div>
      )}

      {/* Summary — §31 4-col desktop, 2-col mobile/tablet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
          <div className="text-xs tracking-wide font-semibold uppercase flex items-center gap-1.5" style={{ color: "var(--color-text-muted)", letterSpacing: "0.03em" }}><Icon name="income" size={12} /> Income</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)", color: "var(--color-income)" }}>{fmt(data.totalIncome)}</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{data.range.start} → {data.range.end}</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
          <div className="text-xs tracking-wide font-semibold uppercase flex items-center gap-1.5" style={{ color: "var(--color-text-muted)", letterSpacing: "0.03em" }}><Icon name="expenses" size={12} /> Expenses</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)", color: "var(--color-expense)" }}>{fmt(data.totalExpense)}</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{data.expenses.filter((e) => e.date >= data.range.start && e.date <= data.range.end).length} records</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
          <div className="text-xs tracking-wide font-semibold uppercase" style={{ color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>Savings</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)", color: data.totalIncome - data.totalExpense >= 0 ? "var(--color-income)" : "var(--color-error)" }}>{fmt(data.totalIncome - data.totalExpense)}</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Rate {data.totalIncome ? ((data.totalIncome - data.totalExpense) / data.totalIncome * 100).toFixed(1) : "—"}%</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-brand-50)" }}>
          <div className="text-xs tracking-wide font-semibold uppercase" style={{ color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>Avg daily</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)", color: "var(--color-text-primary)" }}>{fmt(data.avg)}</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Trailing 90d</div>
        </Card>
      </div>

      {/* All expenses chart — simplified bar on mobile horizontally scrollable */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)" }}><Icon name="barChart" size={16} /> All expenses — {period === "month" ? "daily" : "monthly"}</CardTitle>
          <div className="flex gap-1.5">
            <Button variant="secondary" size="sm" onClick={handleExportCsv} style={{ minHeight: 44 }}>CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => downloadPdfReport()} style={{ minHeight: 44 }}>PDF</Button>
          </div>
        </CardHeader>
        {data.daily.every((d) => d.amount === 0) ? (
          <div className="text-center py-8" style={{ padding: "var(--space-8)" }}>
            <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-muted)]"><Icon name="barChart" size={18} /></div>
            <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>No expenses in period — add an expense to see the chart.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex items-end gap-[2px] h-32 min-w-[520px]">
              {data.daily.map((d) => {
                const h = (d.amount / maxDaily) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      title={`${d.date}: ₹${d.amount}`}
                      className="w-full transition-all"
                      style={{ height: `${h}%`, minHeight: d.amount ? "6px" : "1px", opacity: 0.85, background: "var(--color-expense)", borderRadius: "var(--radius-xs) var(--radius-xs) 0 0" }}
                    />
                    <span className="truncate w-full text-center" style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{period === "month" ? d.date.slice(8) : d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-brand-500)" }}>View as table (accessible)</summary>
          <div className="overflow-auto max-h-64 mt-2 border" style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--color-border)" }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: "var(--color-surface-hover)" }}><tr style={{ color: "var(--color-text-muted)" }}><th className="text-left p-2">Date</th><th className="text-right p-2">Amount</th></tr></thead>
              <tbody>{data.daily.filter((d) => d.amount > 0).slice(0, 100).map((r) => <tr key={r.date} className="border-t" style={{ borderColor: "var(--color-border)" }}><td className="p-2">{r.date}</td><td className="p-2 text-right tabular-nums">{fmt(r.amount)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
          <CardHeader><CardTitle style={{ fontSize: "var(--font-size-h4)" }}>Income vs Expenses</CardTitle></CardHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>Income</span><span className="tabular-nums font-semibold" style={{ color: "var(--color-income)" }}>{fmt(data.totalIncome)}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--color-text-secondary)" }}>Expenses</span><span className="tabular-nums font-semibold" style={{ color: "var(--color-expense)" }}>{fmt(data.totalExpense)}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold" style={{ borderColor: "var(--color-border)" }}><span>Savings</span><span className="tabular-nums">{fmt(data.totalIncome - data.totalExpense)}</span></div>
          </div>
          <div className="mt-3 h-2 overflow-hidden flex" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)" }}>
            <div style={{ width: `${data.totalIncome + data.totalExpense ? (data.totalIncome / (data.totalIncome + data.totalExpense)) * 100 : 50}%`, background: "var(--color-income)" }} />
            <div className="flex-1" style={{ background: "var(--color-expense)" }} />
          </div>
          <p className="mt-2" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>Bars are labeled with amounts and colors — not color alone.</p>
        </Card>

        <Card className="lg:col-span-2" style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
          <CardHeader><CardTitle style={{ fontSize: "var(--font-size-h4)" }}>Category breakdown</CardTitle></CardHeader>
          {data.shares.length === 0 ? (
            <div className="text-center py-6">
              <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-muted)]"><Icon name="barChart" size={18} /></div>
              <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>No expenses in period.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.shares.map((s) => {
                const cat = data.cats.find((c) => c.id === s.categoryId);
                return (
                  <div key={s.categoryId}>
                    <div className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: cat?.color ?? "var(--color-brand-500)" }} aria-hidden />{cat?.name ?? s.categoryId}</span><span className="tabular-nums font-medium">{s.share.toFixed(1)}% · {fmt(s.amount)}</span></div>
                    <div className="h-1.5 mt-1 overflow-hidden" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)" }}><div className="h-full" style={{ width: `${s.share}%`, background: "var(--color-brand-500)", borderRadius: "var(--radius-full)" }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <details className="mt-4"><summary className="cursor-pointer" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-brand-500)" }}>View as table</summary>
            <table className="w-full text-xs mt-2"><thead><tr style={{ color: "var(--color-text-muted)" }}><th className="text-left">Category</th><th className="text-right">Amount</th><th className="text-right">Share</th></tr></thead><tbody>{data.shares.map((r) => { const cat = data.cats.find((c) => c.id === r.categoryId); return <tr key={r.categoryId} style={{ borderTop: "1px solid var(--color-border)" }}><td className="py-1">{cat?.name}</td><td className="text-right tabular-nums py-1">{fmt(r.amount)}</td><td className="text-right py-1">{r.share.toFixed(1)}%</td></tr>; })}</tbody></table>
          </details>
        </Card>
      </div>

      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)" }}><Icon name="calendar" size={16} /> Calendar heatmap — last 35 days (avg daily ₹{data.avg.toFixed(0)})</CardTitle></CardHeader>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => <div key={d} className="text-center" style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{d}</div>)}
          {data.heat.map((h) => {
            const styles: Record<number, React.CSSProperties> = {
              0: { background: "var(--color-surface-hover)", color: "var(--color-text-muted)" },
              1: { background: "#C6F0D8", color: "var(--color-text-primary)" },
              2: { background: "#7ED3A0", color: "var(--color-text-primary)" },
              3: { background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" },
              4: { background: "var(--color-expense-bg)", color: "var(--color-error)", border: "1px solid var(--color-error)" },
            };
            const s = styles[h.level] ?? styles[0];
            return (
              <div
                key={h.date}
                title={`${h.date}: ₹${h.spend} (level ${h.level})`}
                className="h-8 flex items-center justify-center text-[10px] font-medium"
                style={{ borderRadius: "var(--radius-xs)", ...s }}
                role="gridcell"
                aria-label={`${h.date} spend ${h.spend}`}
              >{h.level > 0 ? "•" : ""}</div>
            );
          })}
        </div>
        <p className="mt-2" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>Levels: ≤25%, 25–75%, 75–125%, 125–200%, &gt;200% of trailing 90-day average. Dot + border pattern ensures non-color distinction.</p>
        <details className="mt-3">
          <summary className="cursor-pointer" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-brand-500)" }}>View as table</summary>
          <div className="overflow-auto max-h-64 mt-2 border" style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--color-border)" }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: "var(--color-surface-hover)" }}><tr style={{ color: "var(--color-text-muted)" }}><th className="text-left p-2">Date</th><th className="text-right p-2">Spend</th><th className="text-right p-2">Level</th></tr></thead>
              <tbody>{data.heat.map((r) => <tr key={r.date} style={{ borderTop: "1px solid var(--color-border)" }}><td className="p-2">{r.date}</td><td className="p-2 text-right tabular-nums">{fmt(r.spend)}</td><td className="p-2 text-right">{r.level}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Card>
    </div>
  );
}
