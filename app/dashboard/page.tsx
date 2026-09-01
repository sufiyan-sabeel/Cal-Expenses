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
import { calcCurrentBalance, calcMonthlyIncome, calcMonthlyExpenses, calcMonthlySavings, calcSavingsRate, monthRangeFor, dailySpend } from "@/lib/calculations";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
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
    const gifts = GiftService.getAll();
    const recurring = RecurringService.getAll().filter((r) => r.status === "active" && r.nextOccurrenceDate && r.nextOccurrenceDate >= today).slice(0, 3);
    const upcomingEvents = events.filter((e) => e.startDate >= today).slice(0, 3);
    const todayIncome = incomes.filter((i) => i.date === today).reduce((s, i) => s + i.amount, 0);
    const todayExpense = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today + "T00:00:00"); d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      return { date: iso, spent: dailySpend(iso, expenses) };
    });
    return { profile, balance, monthlyIncome, monthlyExpenses, monthlySavings, savingsRate, recent, recurring, upcomingEvents, todayIncome, todayExpense, last7, expenses, incomes, budgets };
  }, [refresh]);

  useEffect(() => {
    const onStorage = () => setRefresh((v) => v + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("calexpenses:refresh", onStorage as EventListener);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("calexpenses:refresh", onStorage as EventListener); };
  }, []);

  if (loading) return <div className="p-8"><div className="skeleton h-24 w-full rounded-md" /></div>;
  if (!user || !data) return <div className="p-8">Loading…</div>;

  const fmt = (n: number) => {
    try { return new Intl.NumberFormat(data.profile.locale, { style: "currency", currency: data.profile.currency, maximumFractionDigits: 0 }).format(n); }
    catch { return `₹${n}`; }
  };
  const fmtSmall = (n: number) => {
    try { return new Intl.NumberFormat(data.profile.locale, { style: "currency", currency: data.profile.currency, maximumFractionDigits: 0 }).format(n); }
    catch { return `₹${n}`; }
  };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const hasData = data.expenses.length > 0 || data.incomes.length > 0;

  return (
    <div className="space-y-6">
      {/* Top bar per §19.1: greeting + avatar/bell handled by AppShell, but dashboard adds greeting block */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight leading-none" style={{ fontSize: "var(--font-size-h1)" }}>{greeting} 👋</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Ready to see where your money went?</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          {new Date().toLocaleDateString(data.profile.locale, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {!hasData && (
        <Card className="border-dashed bg-[var(--color-brand-50)]" style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
          <h3 className="font-semibold" style={{ fontSize: "var(--font-size-h3)" }}>Welcome! Let’s get you started</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">No transactions yet. Add your first expense to see your balance, budgets and calendar come alive.</p>
          <div className="flex gap-2 mt-4">
            <Link href="/expenses"><Button><Icon name="expenses" size={16} /> Add first expense</Button></Link>
            <Link href="/calendar"><Button variant="secondary">Open calendar</Button></Link>
          </div>
        </Card>
      )}

      {/* Balance Card — hero full-width §20 */}
      <Card className="relative overflow-hidden" style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-5)", boxShadow: "var(--elevation-1)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-secondary)]" style={{ letterSpacing: "0.03em", fontSize: "var(--font-size-caption)" }}>Current Balance</div>
            <div className="mt-1 font-bold tracking-tight" style={{ fontSize: "var(--font-size-financial-lg)", lineHeight: "1.1", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }} aria-label={`Current balance: ${fmt(data.balance)}`}>{fmt(data.balance)}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-2">Starting {fmt(data.profile.startingBalance)} + income − expenses to date</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-muted)]"><Icon name="wallet" size={18} /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5"><Icon name="income" size={14} /> <span className="text-[var(--color-text-secondary)]">Income</span> <span className="ml-auto font-semibold tabular-nums" style={{ color: "var(--color-income)" }}>+{fmtSmall(data.monthlyIncome)}</span></div>
          <div className="flex items-center gap-1.5"><Icon name="expenses" size={14} /> <span className="text-[var(--color-text-secondary)]">Expense</span> <span className="ml-auto font-semibold tabular-nums" style={{ color: "var(--color-expense)" }}>−{fmtSmall(data.monthlyExpenses)}</span></div>
        </div>
      </Card>

      {/* Today's Activity strip — compact two-stat row §19.1 */}
      <div className="grid grid-cols-2 gap-3">
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Today&apos;s Income</div>
          <div className="text-lg font-bold tabular-nums mt-1" style={{ color: "var(--color-income)", fontSize: "var(--font-size-financial-md)" }}>+{fmtSmall(data.todayIncome)}</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Today&apos;s Expense</div>
          <div className="text-lg font-bold tabular-nums mt-1" style={{ color: data.todayExpense ? "var(--color-expense)" : "var(--color-text-primary)", fontSize: "var(--font-size-financial-md)" }}>{data.todayExpense ? `−${fmtSmall(data.todayExpense)}` : fmtSmall(0)}</div>
        </Card>
      </div>

      {/* Quick Add row — 4 circles §19.1 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Expense", icon: "expenses" as const, href: "/expenses" },
          { label: "Income", icon: "income" as const, href: "/income" },
          { label: "Event", icon: "events" as const, href: "/events" },
          { label: "More", icon: "add" as const, href: "/calendar" },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2">
            <span className="h-14 w-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] grid place-items-center" style={{ boxShadow: "var(--elevation-1)" }}><Icon name={a.icon} size={22} /></span>
            <span className="text-xs font-medium">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* 4-col stat row desktop, 2-col tablet, stacked mobile §19.2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Income</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)", color: "var(--color-income)" }}>{fmt(data.monthlyIncome)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">This month</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Expenses</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)", color: "var(--color-expense)" }}>{fmt(data.monthlyExpenses)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">This month</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Savings</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)" }}>{fmt(data.monthlySavings)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">Rate: {data.savingsRate === null ? "—" : `${data.savingsRate.toFixed(1)}%`}</div>
        </Card>
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Balance</div>
          <div className="font-bold tabular-nums mt-1" style={{ fontSize: "var(--font-size-financial-md)" }}>{fmt(data.balance)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">All time</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
            <CardHeader>
              <CardTitle>7-day spending trend</CardTitle>
              <Link href="/analytics" className="text-sm text-[var(--color-brand-500)]">View analytics →</Link>
            </CardHeader>
            {data.last7.every((d) => d.spent === 0) ? (
              <p className="text-sm text-[var(--color-text-muted)]">No spending in last 7 days.</p>
            ) : (
              <div className="flex items-end gap-1 h-24">
                {data.last7.map((d) => {
                  const max = Math.max(...data.last7.map((x) => x.spent), 1);
                  const h = (d.spent / max) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-[var(--color-expense)] rounded-t" style={{ height: `${h}%`, minHeight: d.spent ? "8px" : "2px", opacity: 0.85 }} title={`${d.date}: ${fmt(d.spent)}`} />
                      <span className="text-[10px] text-[var(--color-text-muted)]">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <details className="mt-3">
              <summary className="text-xs text-[var(--color-brand-500)] cursor-pointer">View as table</summary>
              <table className="w-full text-xs mt-2">
                <thead><tr className="text-[var(--color-text-muted)]"><th className="text-left">Date</th><th className="text-right">Spent</th></tr></thead>
                <tbody>{data.last7.map((r) => <tr key={r.date}><td>{r.date}</td><td className="text-right tabular-nums">{fmt(r.spent)}</td></tr>)}</tbody>
              </table>
            </details>
          </Card>

          <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
            <CardHeader><CardTitle>Budget progress</CardTitle><Link href="/budgets" className="text-sm text-[var(--color-brand-500)]">See all →</Link></CardHeader>
            {data.budgets.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center"><Icon name="budgets" size={18} /></div>
                <p className="text-sm font-medium mt-2">No budgets configured yet</p>
                <p className="text-xs text-[var(--color-text-muted)]">Set one in under a minute</p>
                <Link href="/budgets" className="inline-flex mt-3"><Button size="sm">Create budget</Button></Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {data.budgets.slice(0, 2).map((b) => {
                  const spent = data.expenses.filter((e) => e.categoryId === b.categoryId && e.date >= b.periodStart && (!b.periodEnd || e.date <= b.periodEnd)).reduce((s, e) => s + e.amount, 0);
                  const pct = b.amount ? Math.min((spent / b.amount) * 100, 100) : 0;
                  const over = spent > b.amount ? spent - b.amount : 0;
                  return (
                    <li key={b.id}>
                      <div className="flex justify-between text-sm"><span>{b.name}</span><span className="tabular-nums">{pct.toFixed(0)}%</span></div>
                      <div className="h-2 bg-[var(--color-surface-hover)] rounded-full mt-1 overflow-hidden" style={{ borderRadius: "var(--radius-full)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--color-error)" : pct >= 80 ? "var(--color-warning)" : "var(--color-income)", transition: "width var(--motion-duration-base) var(--motion-easing-standard)" }} />
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">{fmt(spent)} / {fmt(b.amount)} {over > 0 && <span className="text-[var(--color-error)]">+{fmt(over)} over</span>}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
            <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
            {(data.recurring.length === 0 && data.upcomingEvents.length === 0) ? (
              <p className="text-sm text-[var(--color-text-muted)]">Nothing due soon.</p>
            ) : (
              <div className="space-y-2">
                {data.recurring.slice(0, 2).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2">
                    <div className="h-9 w-9 rounded-md bg-[var(--color-warning-bg)] grid place-items-center text-[var(--color-warning)]"><Icon name="receipt" size={16} /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.type} • {r.frequency}</div><div className="text-xs text-[var(--color-text-muted)]">{r.nextOccurrenceDate}</div></div>
                    <div className="text-sm font-semibold tabular-nums">{fmt(r.amount)}</div>
                  </div>
                ))}
                {data.upcomingEvents.slice(0, 2).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-2">
                    <div className="h-9 w-9 rounded-md bg-[var(--color-event-bg)] grid place-items-center text-[var(--color-event)]"><Icon name="calendar" size={16} /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{e.title}</div><div className="text-xs text-[var(--color-text-muted)]">{e.startDate}</div></div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
            <CardHeader><CardTitle>Recent transactions</CardTitle><Link href="/expenses" className="text-sm text-[var(--color-brand-500)]">See all →</Link></CardHeader>
            {data.recent.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center"><Icon name="expenses" size={18} /></div>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">No expenses yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.recent.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-[var(--color-expense-bg)] grid place-items-center text-[var(--color-expense)]"><Icon name="expenses" size={14} /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{e.description ?? e.merchant ?? "Expense"}</div><div className="text-xs text-[var(--color-text-muted)]">{e.date}</div></div>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-expense)" }}>−{fmt(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-[var(--color-ai-bg)]" style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[var(--color-ai)]"><Icon name="ai" size={14} /> AI Insight</div>
            <p className="text-sm mt-2">Check back after a few days of activity for personalized insights.</p>
            <Link href="/ai" className="text-xs text-[var(--color-ai)] mt-2 inline-flex">Open AI →</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
