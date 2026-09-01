"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { ProfileService } from "@/lib/services/profile.service";
import { ExpenseService } from "@/lib/services/expense.service";
import { IncomeService } from "@/lib/services/income.service";
import { BudgetService } from "@/lib/services/budget.service";
import { EventService } from "@/lib/services/event.service";
import { GiftService } from "@/lib/services/gift.service";
import { RecurringService } from "@/lib/services/recurring.service";
import { calcCurrentBalance, calcMonthlyIncome, calcMonthlyExpenses, calcMonthlySavings, calcSavingsRate, monthRangeFor, dailySpend, trailing90DayAvg } from "@/lib/calculations";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { ShareButton } from "@/components/ui/share-button";
import { todayISODate } from "@/lib/domain/common";
import Link from "next/link";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
    const prof = ProfileService.get();
    if (!loading && user && prof && !prof.onboardingCompleted) router.replace("/onboarding");
  }, [user, loading, router]);

  const data = useMemo(() => {
    if (typeof window === "undefined") return null;
    const profile = ProfileService.get();
    if (!profile) return null;
    const today = todayISODate();
    const expenses = ExpenseService.getAll();
    const incomes = IncomeService.getAll();
    const budgets = BudgetService.getAll();
    const events = EventService.getAll();
    const { start, end } = monthRangeFor(today);
    const monthlyIncome = calcMonthlyIncome(incomes, start, end);
    const monthlyExpenses = calcMonthlyExpenses(expenses, start, end);
    const monthlySavings = calcMonthlySavings(monthlyIncome, monthlyExpenses);
    const savingsRate = calcSavingsRate(monthlySavings, monthlyIncome);
    const balance = calcCurrentBalance(profile.startingBalance, incomes, expenses, today);
    const recent = expenses.slice(0, 5);
    // upcoming
    const gifts = GiftService.getAll();
    const recurring = RecurringService.getAll().filter((r) => r.status === "active" && r.nextOccurrenceDate && r.nextOccurrenceDate >= today).slice(0, 5);
    const upcomingEvents = events.filter((e) => e.startDate >= today).slice(0, 5);
    // insights
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today + "T00:00:00"); d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      return { date: iso, spent: dailySpend(iso, expenses) };
    });
    return { profile, balance, monthlyIncome, monthlyExpenses, monthlySavings, savingsRate, recent, recurring, upcomingEvents, last7, expenses, incomes, budgets };
  }, [refresh]);

  useEffect(() => {
    const onStorage = () => setRefresh((v) => v + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("calexpenses:refresh", onStorage as EventListener);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("calexpenses:refresh", onStorage as EventListener); };
  }, []);

  if (loading) return <div className="p-8">Loading dashboard…</div>;
  if (!user || !data) return <div className="p-8">Loading…</div>;

  const fmt = (n: number) => {
    try { return new Intl.NumberFormat(data.profile.locale, { style: "currency", currency: data.profile.currency, maximumFractionDigits: 0 }).format(n); }
    catch { return `₹${n}`; }
  };

  const hasData = data.expenses.length > 0 || data.incomes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Icon name="dashboard" size={22} /> Dashboard</h1>
        <div className="flex items-center gap-2">
          <ShareButton title="CAL-EXPENSES Dashboard" text={`Balance ${fmt(data.balance)} • Income ${fmt(data.monthlyIncome)} • Expenses ${fmt(data.monthlyExpenses)}`} />
          <span className="hidden sm:inline text-sm text-[var(--text-tertiary)]">{new Date().toLocaleDateString(data.profile.locale, { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {!hasData && (
        <Card className="border-dashed bg-[var(--accent-primary-subtle)]">
          <h3 className="font-medium">Welcome! Let’s get you started</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">No transactions yet. Add your first expense to see your balance, budgets and calendar come alive.</p>
          <div className="flex gap-2 mt-4">
            <Link href="/expenses?action=new"><Button> Add first expense</Button></Link>
            <Link href="/calendar"><Button variant="secondary">Open calendar</Button></Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-[var(--text-secondary)]">Current Balance</CardTitle></CardHeader>
          <div className="display-number text-2xl font-bold tabular-nums" aria-label={`Current balance: ${fmt(data.balance)}`}>{fmt(data.balance)}</div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Starting {fmt(data.profile.startingBalance)} + income − expenses to date</p>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[var(--text-secondary)]">Monthly Income</CardTitle></CardHeader>
          <div className="display-number text-2xl font-semibold tabular-nums text-[var(--semantic-income)]">{fmt(data.monthlyIncome)}</div>
          <p className="text-xs text-[var(--text-tertiary)]">This month</p>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[var(--text-secondary)]">Monthly Expenses</CardTitle></CardHeader>
          <div className="display-number text-2xl font-semibold tabular-nums text-[var(--semantic-expense)]">{fmt(data.monthlyExpenses)}</div>
          <p className="text-xs text-[var(--text-tertiary)]">This month</p>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-[var(--text-secondary)]">Savings</CardTitle></CardHeader>
          <div className="display-number text-2xl font-semibold tabular-nums">{fmt(data.monthlySavings)}</div>
          <p className="text-xs text-[var(--text-tertiary)]">Rate: {data.savingsRate === null ? "—" : `${data.savingsRate.toFixed(1)}%`}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7-day spending trend</CardTitle>
            <Link href="/analytics" className="text-sm text-[var(--accent-primary)]">View analytics →</Link>
          </CardHeader>
          {data.last7.every((d) => d.spent === 0) ? (
            <p className="text-sm text-[var(--text-tertiary)]">No spending in last 7 days.</p>
          ) : (
            <div className="flex items-end gap-1 h-24">
              {data.last7.map((d) => {
                const max = Math.max(...data.last7.map((x) => x.spent), 1);
                const h = (d.spent / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[var(--semantic-expense)] rounded-t" style={{ height: `${h}%`, minHeight: d.spent ? "8px" : "2px", opacity: 0.85 }} title={`${d.date}: ${fmt(d.spent)}`} />
                    <span className="text-[10px] text-[var(--text-tertiary)]">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
          {/* table alternative */}
          <details className="mt-3">
            <summary className="text-xs text-[var(--accent-primary)] cursor-pointer">View as table</summary>
            <table className="w-full text-xs mt-2">
              <thead><tr className="text-[var(--text-tertiary)]"><th className="text-left">Date</th><th className="text-right">Spent</th></tr></thead>
              <tbody>{data.last7.map((r) => <tr key={r.date}><td>{r.date}</td><td className="text-right tabular-nums">{fmt(r.spent)}</td></tr>)}</tbody>
            </table>
          </details>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent transactions</CardTitle><Link href="/expenses" className="text-sm text-[var(--accent-primary)]">View all →</Link></CardHeader>
          {data.recent.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No expenses yet — add your first one to see it here.</p>
          ) : (
            <ul className="space-y-2">
              {data.recent.map((e) => (
                <li key={e.id} className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-sm">{e.description ?? e.merchant ?? "Expense"}</span>
                  <span className="text-sm font-medium tabular-nums text-[var(--semantic-expense)]">{fmt(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Budget utilization</CardTitle><Link href="/budgets" className="text-sm text-[var(--accent-primary)]">Manage →</Link></CardHeader>
          {data.budgets.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No budget set — create one to track it here.</p>
          ) : (
            <ul className="space-y-3">
              {data.budgets.slice(0, 3).map((b) => {
                const spent = data.expenses.filter((e) => e.categoryId === b.categoryId && e.date >= b.periodStart && (!b.periodEnd || e.date <= b.periodEnd)).reduce((s, e) => s + e.amount, 0);
                const pct = b.amount ? Math.min((spent / b.amount) * 100, 100) : 0;
                const over = spent > b.amount ? spent - b.amount : 0;
                return (
                  <li key={b.id}>
                    <div className="flex justify-between text-sm"><span>{b.name}</span><span className="tabular-nums">{pct.toFixed(0)}%</span></div>
                    <div className="h-2 bg-[var(--surface-elevated-2)] rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--semantic-danger)" : pct >= 80 ? "var(--semantic-warning)" : "var(--semantic-income)" }} />
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">{fmt(spent)} / {fmt(b.amount)} {over > 0 && <span className="text-[var(--semantic-danger)]">+{fmt(over)} over</span>}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming bills</CardTitle></CardHeader>
          {data.recurring.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">No upcoming bills in next 7 days.</p> : (
            <ul className="space-y-2">
              {data.recurring.map((r) => (
                <li key={r.id} className="flex justify-between text-sm py-1 border-b border-[var(--border-subtle)] last:border-0">
                  <span>{r.type} • {r.frequency}</span>
                  <span className="tabular-nums">{fmt(r.amount)} <span className="text-xs text-[var(--text-tertiary)]">{r.nextOccurrenceDate}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming events</CardTitle><Link href="/events" className="text-sm text-[var(--accent-primary)]">View →</Link></CardHeader>
          {data.upcomingEvents.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">No events in next 14 days.</p> : (
            <ul className="space-y-2">
              {data.upcomingEvents.map((e) => (
                <li key={e.id} className="flex justify-between text-sm py-1 border-b border-[var(--border-subtle)] last:border-0">
                  <span>{e.title}</span><span className="text-xs text-[var(--text-tertiary)]">{e.startDate}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
