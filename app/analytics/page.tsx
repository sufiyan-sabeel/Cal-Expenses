"use client";
import React, { useMemo, useState } from "react";
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [refresh, setRefresh] = useState(0);

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
    const heat = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(today + "T00:00:00"); d.setDate(d.getDate() - (34 - i));
      const iso = d.toISOString().slice(0, 10);
      const spend = dailySpend(iso, expenses);
      return { date: iso, spend, level: calendarHeatmapLevel(spend, avg) as number };
    });
    // Daily series for chart
    const daily = (() => {
      const map = new Map<string, number>();
      for (const e of expenses.filter((e) => e.date >= range.start && e.date <= range.end)) {
        map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
      }
      // fill dates
      const out: { date: string; amount: number }[] = [];
      const s = new Date(range.start + "T00:00:00");
      const e = new Date(range.end + "T00:00:00");
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);
        out.push({ date: iso, amount: map.get(iso) ?? 0 });
      }
      // for month, limit to period; for year, sample monthly
      if (period === "year") {
        const monthly = new Map<string, number>();
        for (const ex of expenses.filter((ex) => ex.date >= range.start && ex.date <= range.end)) {
          const k = ex.date.slice(0, 7);
          monthly.set(k, (monthly.get(k) ?? 0) + ex.amount);
        }
        return Array.from(monthly.entries()).map(([date, amount]) => ({ date, amount }));
      }
      return out;
    })();
    return { expenses, incomes, cats, shares, totalIncome, totalExpense, heat, avg, range, daily, today };
  }, [period, refresh]);

  React.useEffect(() => {
    const h = () => setRefresh((v) => v + 1);
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("focus", h);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("focus", h); };
  }, []);

  const fmt = (n: number) => `₹${n.toFixed(0)}`;
  const maxDaily = Math.max(...data.daily.map((d) => d.amount), 1);

  const handlePrint = () => {
    const { html } = buildAllExpensesReport();
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };
  const handleShare = () => {
    const text = `Analytics ${period}: Income ${fmt(data.totalIncome)}, Expenses ${fmt(data.totalExpense)}, Savings ${fmt(data.totalIncome - data.totalExpense)}`;
    if (navigator.share) navigator.share({ title: "CAL-EXPENSES Analytics", text }).catch(() => {});
    else if (navigator.clipboard) { navigator.clipboard.writeText(text); alert("Copied analytics summary"); }
  };
  const handleExportCsv = () => {
    const rows = data.daily.map((d) => ({ date: d.date, amount: d.amount }));
    const csv = ["date,amount", ...rows.map((r) => `${r.date},${r.amount}`)].join("\n");
    downloadBlob(csv, `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Icon name="analytics" size={20} /> Analytics</h1>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] px-3 text-sm">
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>
          <Button variant="secondary" size="sm" onClick={handlePrint}><Icon name="receipt" size={14} /> <span className="hidden sm:inline ml-1">Print</span></Button>
          <ShareButton title="CAL-EXPENSES Analytics" text={`Income ${fmt(data.totalIncome)} Expenses ${fmt(data.totalExpense)}`} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs tracking-wide font-medium text-[var(--text-tertiary)] uppercase flex items-center gap-1"><Icon name="income" size={12} /> Income</div>
          <div className="text-xl font-semibold tabular-nums text-[var(--semantic-income)] mt-1">{fmt(data.totalIncome)}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{data.range.start} → {data.range.end}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide font-medium text-[var(--text-tertiary)] uppercase flex items-center gap-1"><Icon name="expenses" size={12} /> Expenses</div>
          <div className="text-xl font-semibold tabular-nums text-[var(--semantic-expense)] mt-1">{fmt(data.totalExpense)}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{data.expenses.filter((e) => e.date >= data.range.start && e.date <= data.range.end).length} records</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs tracking-wide font-medium text-[var(--text-tertiary)] uppercase">Savings</div>
          <div className={`text-xl font-semibold tabular-nums mt-1 ${data.totalIncome - data.totalExpense >= 0 ? "text-[var(--semantic-income)]" : "text-[var(--semantic-danger)]"}`}>{fmt(data.totalIncome - data.totalExpense)}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Rate {data.totalIncome ? ((data.totalIncome - data.totalExpense) / data.totalIncome * 100).toFixed(1) : "—"}%</div>
        </Card>
        <Card className="p-4 bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)]/20">
          <div className="text-xs tracking-wide font-medium text-[var(--text-tertiary)] uppercase">Avg daily</div>
          <div className="text-xl font-semibold tabular-nums mt-1">{fmt(data.avg)}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Trailing 90d</div>
        </Card>
      </div>

      {/* All expenses chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icon name="barChart" size={16} /> All expenses chart — {period === "month" ? "daily" : "monthly"}</CardTitle>
          <div className="flex gap-1.5">
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => downloadPdfReport()}>PDF</Button>
          </div>
        </CardHeader>
        {data.daily.every((d) => d.amount === 0) ? (
          <p className="text-sm text-[var(--text-tertiary)]">No expenses in period — add an expense to see chart.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex items-end gap-[2px] h-32 min-w-[520px]">
              {data.daily.map((d) => {
                const h = (d.amount / maxDaily) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div title={`${d.date}: ₹${d.amount}`} className="w-full rounded-t bg-[var(--semantic-expense)] transition-all" style={{ height: `${h}%`, minHeight: d.amount ? "6px" : "1px", opacity: 0.85 }} />
                    <span className="text-[9px] text-[var(--text-tertiary)] truncate w-full text-center">{period === "month" ? d.date.slice(8) : d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <details className="mt-3">
          <summary className="text-xs text-[var(--accent-primary)] cursor-pointer">View as table (accessible)</summary>
          <div className="overflow-auto max-h-64 mt-2 border rounded-md">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--surface-elevated-2)]"><tr className="text-[var(--text-tertiary)]"><th className="text-left p-2">Date</th><th className="text-right p-2">Amount</th></tr></thead>
              <tbody>{data.daily.filter((d) => d.amount > 0).slice(0, 100).map((r) => <tr key={r.date} className="border-t"><td className="p-2">{r.date}</td><td className="p-2 text-right tabular-nums">{fmt(r.amount)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Income</span><span className="tabular-nums text-[var(--semantic-income)]">{fmt(data.totalIncome)}</span></div><div className="flex justify-between"><span>Expenses</span><span className="tabular-nums text-[var(--semantic-expense)]">{fmt(data.totalExpense)}</span></div><div className="border-t pt-2 flex justify-between font-semibold"><span>Savings</span><span className="tabular-nums">{fmt(data.totalIncome - data.totalExpense)}</span></div></div>
          <div className="mt-3 h-2 bg-[var(--surface-elevated-2)] rounded-full overflow-hidden flex">
            <div className="bg-[var(--semantic-income)]" style={{ width: `${data.totalIncome + data.totalExpense ? (data.totalIncome / (data.totalIncome + data.totalExpense)) * 100 : 50}%` }} />
            <div className="bg-[var(--semantic-expense)] flex-1" />
          </div>
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
