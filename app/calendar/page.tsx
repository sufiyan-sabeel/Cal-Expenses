"use client";
import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ExpenseService } from "@/lib/services/expense.service";
import { IncomeService } from "@/lib/services/income.service";
import { EventService } from "@/lib/services/event.service";
import { GiftService } from "@/lib/services/gift.service";
import { RecurringService } from "@/lib/services/recurring.service";
import { ReminderService } from "@/lib/services/reminder.service";
import { GoalService } from "@/lib/services/goal.service";
import { FamilyService } from "@/lib/services/family.service";
import { getOccurrencesInRange, getDayDetail } from "@/lib/calendar/occurrence";
import { todayISODate, toISODate } from "@/lib/domain/common";

type View = "month" | "week" | "day" | "agenda";

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay(); // 0 Sun
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayISODate());
  const [filter, setFilter] = useState<string>("all");
  // For the requested shadcn-style picker demo — exact API the user asked for
  const selectedDateObj = React.useMemo(() => new Date(selected + "T00:00:00"), [selected]);

  const data = useMemo(() => ({
    expenses: ExpenseService.getAll(),
    incomes: IncomeService.getAll(),
    recurring: RecurringService.getAll(),
    events: EventService.getAll(),
    gifts: GiftService.getAll(),
    reminders: ReminderService.getAll(),
    goals: GoalService.getAll(),
    familyMembers: FamilyService.getAll(),
  }), []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = monthGrid(year, month);
  const monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  const occurrences = getOccurrencesInRange({ start: monthStart, end: monthEnd }, data);
  const dayDetail = getDayDetail(selected, data);

  const byDate = new Map<string, typeof occurrences>();
  for (const o of occurrences) {
    if (filter !== "all" && o.type !== filter) continue;
    const arr = byDate.get(o.date) ?? [];
    arr.push(o);
    byDate.set(o.date, arr);
  }

  const legend = [
    { type: "income", label: "Income", color: "var(--indicator-income)", icon: "↓" },
    { type: "expense", label: "Expense", color: "var(--indicator-expense)", icon: "↑" },
    { type: "bill", label: "Bill", color: "var(--indicator-bill)", icon: "▭" },
    { type: "event", label: "Event", color: "var(--indicator-event)", icon: "★" },
    { type: "gift", label: "Gift", color: "var(--indicator-gift)", icon: "✦" },
    { type: "goal", label: "Goal", color: "var(--indicator-goal)", icon: "⚑" },
    { type: "reminder", label: "Reminder", color: "var(--indicator-reminder)", icon: "🔔" },
  ];

  return (
    <div className="space-y-4">
      {/* Requested exact API demo — shadcn-style dropdown calendar */}
      <Card className="flex flex-col lg:flex-row gap-6 items-start">
        <div>
          <h2 className="text-sm font-semibold">Pick a date —{" "}
            <span className="font-normal text-[var(--text-secondary)]">
              <code className="text-xs bg-[var(--surface-elevated-2)] px-1.5 py-0.5 rounded">captionLayout=&quot;dropdown&quot;</code>
            </span>
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Exact code you asked for:</p>
          <pre className="mt-2 text-xs bg-[#0B0B0C] text-gray-200 p-3 rounded-md overflow-auto">
{`"use client"
import * as React from "react"
import { Calendar } from "@/components/ui/calendar"

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
  )
}`}
          </pre>
        </div>
        <div className="shrink-0">
          <Calendar
            mode="single"
            selected={selectedDateObj}
            onSelect={(d) => {
              if (!d) return;
              const iso = toISODate(d);
              setSelected(iso);
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
            }}
            className="rounded-lg border"
            captionLayout="dropdown"
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
            Selected: <span className="font-medium text-[var(--text-primary)]">{selected}</span>
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Financial Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { const d = new Date(); setCursor(d); setSelected(d.toISOString().slice(0, 10)); }}>Today</Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</Button>
          <span className="font-medium min-w-[140px] text-center">{cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["month", "week", "day", "agenda"] as View[]).map((v) => (
          <Button key={v} variant={view === v ? "primary" : "secondary"} size="sm" onClick={() => setView(v)}>{v[0]!.toUpperCase() + v.slice(1)}</Button>
        ))}
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] px-3 text-sm">
          <option value="all">All types</option>
          {legend.map((l) => <option key={l.type} value={l.type}>{l.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="text-[var(--text-tertiary)]">Legend:</span>
        {legend.map((l) => (
          <span key={l.type} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border flex items-center justify-center text-[7px] leading-none" style={{ background: l.color, color: "white", borderColor: l.color }}>{l.icon}</span>
            {l.label}
          </span>
        ))}
      </div>

      {view === "month" && (
        <div className="grid grid-cols-7 gap-px bg-[var(--border-subtle)] rounded-lg overflow-hidden border border-[var(--border-subtle)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-[var(--surface-elevated-2)] text-center py-2 text-xs font-medium text-[var(--text-secondary)]">{d}</div>
          ))}
          {grid.map((d, idx) => {
            if (!d) return <div key={idx} className="bg-[var(--surface-elevated-1)] min-h-[96px] lg:min-h-[110px]" />;
            const iso = d.toISOString().slice(0, 10);
            const isToday = iso === todayISODate();
            const isSelected = iso === selected;
            const occ = byDate.get(iso) ?? [];
            const spent = data.expenses.filter((e) => e.date === iso).reduce((s, e) => s + e.amount, 0);
            return (
              <button key={iso} onClick={() => setSelected(iso)} className={`bg-[var(--surface-elevated-1)] text-left p-1.5 lg:p-2 min-h-[96px] lg:min-h-[110px] relative hover:bg-[var(--surface-elevated-2)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent-primary)] ${isSelected ? "bg-[var(--accent-primary-subtle)]" : ""}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-xs lg:text-sm h-6 w-6 flex items-center justify-center rounded-full ${isToday ? "ring-2 ring-[var(--accent-primary)] font-semibold" : ""} ${isSelected ? "bg-[var(--accent-primary)] text-white" : ""}`}>{d.getDate()}</span>
                  {spent > 0 && <span className="hidden lg:block text-[10px] text-[var(--semantic-expense)] tabular-nums">₹{spent}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {occ.slice(0, 4).map((o, i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full flex items-center justify-center text-[6px] text-white" style={{ background: legend.find((l) => l.type === o.type)?.color }} title={`${o.type}: ${o.label}`}>
                      {legend.find((l) => l.type === o.type)?.icon}
                    </span>
                  ))}
                  {occ.length > 4 && <span className="text-[10px] text-[var(--text-tertiary)]">+{occ.length - 4}</span>}
                </div>
                {occ.length > 0 && <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] lg:hidden" />}
              </button>
            );
          })}
        </div>
      )}

      {view !== "month" && (
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            {view === "week" ? "Week view shows the current 7-day window with full transaction detail." : view === "day" ? "Day view — detailed list for the selected date." : "Agenda view — chronological list of upcoming occurrences."}
          </p>
          <div className="mt-3 grid gap-2">
            {(view === "agenda" ? [...occurrences].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20) : (byDate.get(selected) ?? []).length ? (byDate.get(selected) ?? []) : []).map((o, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-[var(--border-subtle)] text-sm"><span>{o.date} · <span className="capitalize">{o.type}</span> — {o.label}</span></div>
            ))}
            {view !== "agenda" && (byDate.get(selected) ?? []).length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No items on {selected}.</p>}
          </div>
        </Card>
      )}

      {/* Day detail bottom sheet / side panel */}
      <Card className="lg:sticky lg:top-[72px]">
        <h3 className="font-semibold">Day detail — {selected}</h3>
        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
          <div><span className="text-[var(--text-tertiary)]">Spent</span><div className="font-semibold tabular-nums text-[var(--semantic-expense)]">₹{dayDetail.totalSpent.toFixed(2)}</div></div>
          <div><span className="text-[var(--text-tertiary)]">Income</span><div className="font-semibold tabular-nums text-[var(--semantic-income)]">₹{dayDetail.totalIncome.toFixed(2)}</div></div>
        </div>
        <div className="mt-4 space-y-2">
          {dayDetail.expenses.map((e) => <div key={e.id} className="flex justify-between text-sm py-1 border-b border-[var(--border-subtle)]"><span>{e.description ?? e.merchant ?? "Expense"}</span><span className="tabular-nums">₹{e.amount}</span></div>)}
          {dayDetail.incomes.map((i) => <div key={i.id} className="flex justify-between text-sm py-1 border-b border-[var(--border-subtle)]"><span>{i.description ?? "Income"}</span><span className="tabular-nums text-[var(--semantic-income)]">₹{i.amount}</span></div>)}
          {dayDetail.events.map((e) => <div key={e.id} className="text-sm py-1">🎉 {e.title} ({e.startDate} → {e.endDate})</div>)}
          {dayDetail.gifts.map((g) => <div key={g.id} className="text-sm py-1">🎁 Gift for {g.recipient} — {g.budget ? `budget ₹${g.budget}` : ""}</div>)}
          {dayDetail.expenses.length === 0 && dayDetail.incomes.length === 0 && dayDetail.events.length === 0 && dayDetail.gifts.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No transactions on this date.</p>}
        </div>
      </Card>
    </div>
  );
}
