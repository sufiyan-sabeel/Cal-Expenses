"use client";
import React, { useMemo, useState } from "react";
import { ExpenseService } from "@/lib/services/expense.service";
import { IncomeService } from "@/lib/services/income.service";
import { CategoryService } from "@/lib/services/category.service";
import { categoryShares, trailing90DayAvg, dailySpend, calendarHeatmapLevel, monthRangeFor } from "@/lib/calculations";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { todayISODate } from "@/lib/domain/common";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const data = useMemo(() => {
    const expenses = ExpenseService.getAll();
    const incomes = IncomeService.getAll();
    const cats = CategoryService.getAll();
    const today = todayISODate();
    const range = period === "month" ? monthRangeFor(today) : { start: `${today.slice(0, 4)}-01-01`, end: `${today.slice(0, 4)}-12-31` };
    const shares = categoryShares(expenses, range.start, range.end);
    const totalIncome = incomes.filter((i) => i.date >= range.start && i.date <= range.end).reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenses.filter((e) => e.date >= range.start && e.date <= range.end).reduce((s, e) => s + e.amount, 0);
    const avg = trailing90DayAvg(today, expenses);
    // heatmap for last 35 days
    const heat = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(today + "T00:00:00"); d.setDate(d.getDate() - (34 - i));
      const iso = d.toISOString().slice(0, 10);
      const spend = dailySpend(iso, expenses);
      return { date: iso, spend, level: calendarHeatmapLevel(spend, avg) as number };
    });
    return { expenses, incomes, cats, shares, totalIncome, totalExpense, heat, avg, range };
  }, [period]);

  const fmt = (n: number) => `₹${n.toFixed(0)}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Analytics</h1><select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="h-9 rounded-md border border-[var(--border-subtle)] px-3 text-sm"><option value="month">This month</option><option value="year">This year</option></select></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Income</span><span className="tabular-nums text-[var(--semantic-income)]">{fmt(data.totalIncome)}</span></div><div className="flex justify-between"><span>Expenses</span><span className="tabular-nums text-[var(--semantic-expense)]">{fmt(data.totalExpense)}</span></div><div className="border-t pt-2 flex justify-between font-semibold"><span>Savings</span><span className="tabular-nums">{fmt(data.totalIncome - data.totalExpense)}</span></div></div>
        </Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Category breakdown</CardTitle></CardHeader>
          {data.shares.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">No expenses in period.</p> : (
            <div className="space-y-2">
              {data.shares.map((s) => {
                const cat = data.cats.find((c) => c.id === s.categoryId);
                return (
                  <div key={s.categoryId}>
                    <div className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: cat?.color }} />{cat?.name ?? s.categoryId}</span><span className="tabular-nums">{s.share.toFixed(1)}% · {fmt(s.amount)}</span></div>
                    <div className="h-1.5 bg-[var(--surface-elevated-2)] rounded-full mt-1 overflow-hidden"><div className="h-full bg-[var(--accent-primary)]" style={{ width: `${s.share}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <details className="mt-3"><summary className="text-xs text-[var(--accent-primary)] cursor-pointer">View as table</summary>
            <table className="w-full text-xs mt-2"><thead><tr className="text-[var(--text-tertiary)]"><th className="text-left">Category</th><th className="text-right">Amount</th><th className="text-right">Share</th></tr></thead><tbody>{data.shares.map((r) => { const cat = data.cats.find((c) => c.id === r.categoryId); return <tr key={r.categoryId}><td>{cat?.name}</td><td className="text-right tabular-nums">{fmt(r.amount)}</td><td className="text-right">{r.share.toFixed(1)}%</td></tr>; })}</tbody></table>
          </details>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Calendar heatmap — last 35 days (avg daily ₹{data.avg.toFixed(0)})</CardTitle></CardHeader>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => <div key={d} className="text-[10px] text-center text-[var(--text-tertiary)]">{d}</div>)}
          {data.heat.map((h) => {
            const bg = ["bg-[var(--surface-elevated-2)]", "bg-[#C6F0D8]", "bg-[#7ED3A0]", "bg-[#E8B86A]", "bg-[#E0563F]"][h.level] ?? "bg-[var(--surface-elevated-2)]";
            const pattern = h.level >= 3 ? "ring-1 ring-[var(--border-strong)]" : "";
            return <div key={h.date} title={`${h.date}: ₹${h.spend}`} className={`h-8 rounded-sm ${bg} ${pattern} flex items-center justify-center text-[10px] text-[var(--text-secondary)]`}>{h.level > 0 ? "•" : ""}</div>;
          })}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-2">Levels: ≤25%, 25–75%, 75–125%, 125–200%, &gt;200% of trailing 90-day average. Pattern+color for colorblind-safe.</p>
      </Card>
    </div>
  );
}
