/**
 * Occurrence Engine — pure, memoized calculation of calendar indicators.
 */
import type { Expense, Income, Event, Gift, RecurringTransaction, FamilyMember, Reminder, Goal } from "../domain/models";
import type { ISODateString } from "../domain/common";

export type OccurrenceType = "income" | "expense" | "bill" | "event" | "gift" | "goal" | "reminder";

export interface CalendarOccurrence {
  date: ISODateString;
  type: OccurrenceType;
  refId: string;
  label: string;
}

export interface CalendarDataSnapshot {
  expenses: Expense[];
  incomes: Income[];
  recurring: RecurringTransaction[];
  events: Event[];
  gifts: Gift[];
  reminders: Reminder[];
  goals: Goal[];
  familyMembers: FamilyMember[];
}

function addDays(dateStr: ISODateString, days: number): ISODateString {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
}

function nextOccurrenceDate(rec: RecurringTransaction, from: ISODateString): ISODateString | null {
  let cur: ISODateString = rec.nextOccurrenceDate ?? rec.startDate;
  if (cur < from) {
    // fast forward
    const days = diffDays(cur, from);
    if (rec.frequency === "daily") {
      const steps = Math.ceil(days / 1);
      cur = addDays(cur, steps);
    } else if (rec.frequency === "weekly") {
      const steps = Math.ceil(days / 7);
      cur = addDays(cur, steps * 7);
    } else if (rec.frequency === "biweekly") {
      const steps = Math.ceil(days / 14);
      cur = addDays(cur, steps * 14);
    } else if (rec.frequency === "monthly") {
      let d = new Date(cur + "T00:00:00");
      const target = new Date(from + "T00:00:00");
      while (d < target) {
        d.setMonth(d.getMonth() + 1);
      }
      cur = d.toISOString().slice(0, 10);
    } else if (rec.frequency === "yearly") {
      let d = new Date(cur + "T00:00:00");
      const target = new Date(from + "T00:00:00");
      while (d < target) d.setFullYear(d.getFullYear() + 1);
      cur = d.toISOString().slice(0, 10);
    } else if (rec.frequency === "custom" && rec.customIntervalDays) {
      const steps = Math.ceil(days / rec.customIntervalDays);
      cur = addDays(cur, steps * rec.customIntervalDays);
    }
  }
  if (rec.endDate && cur > rec.endDate) return null;
  if (rec.status !== "active") return null;
  return cur;
}

function expandRecurringInRange(rec: RecurringTransaction, rangeStart: ISODateString, rangeEnd: ISODateString): ISODateString[] {
  if (rec.status !== "active") return [];
  const out: ISODateString[] = [];
  let cur: ISODateString | null = nextOccurrenceDate(rec, rangeStart);
  // For monthly/yearly we need iterative stepping; for others step by interval
  let iterations = 0;
  while (cur && cur <= rangeEnd && iterations < 500) {
    if (cur >= rangeStart) out.push(cur);
    // advance one step
    if (rec.frequency === "daily") cur = addDays(cur, 1);
    else if (rec.frequency === "weekly") cur = addDays(cur, 7);
    else if (rec.frequency === "biweekly") cur = addDays(cur, 14);
    else if (rec.frequency === "monthly") {
      const d = new Date(cur + "T00:00:00");
      d.setMonth(d.getMonth() + 1);
      cur = d.toISOString().slice(0, 10);
    } else if (rec.frequency === "yearly") {
      const d = new Date(cur + "T00:00:00");
      d.setFullYear(d.getFullYear() + 1);
      cur = d.toISOString().slice(0, 10);
    } else if (rec.frequency === "custom" && rec.customIntervalDays) cur = addDays(cur, rec.customIntervalDays);
    else break;
    if (rec.endDate && cur > rec.endDate) break;
    if (rec.occurrenceCount !== null && out.length >= rec.occurrenceCount) break;
    iterations++;
  }
  return out;
}

export function getOccurrencesInRange(
  range: { start: ISODateString; end: ISODateString },
  data: CalendarDataSnapshot
): CalendarOccurrence[] {
  const out: CalendarOccurrence[] = [];

  for (const e of data.expenses) {
    if (e.date >= range.start && e.date <= range.end) {
      out.push({ date: e.date, type: "expense", refId: e.id, label: e.description ?? `Expense ${e.amount}` });
    }
  }
  for (const i of data.incomes) {
    if (i.date >= range.start && i.date <= range.end) {
      out.push({ date: i.date, type: "income", refId: i.id, label: i.description ?? `Income ${i.amount}` });
    }
  }
  for (const rec of data.recurring) {
    if (rec.type === "expense" || rec.type === "income") {
      const dates = expandRecurringInRange(rec, range.start, range.end);
      for (const d of dates) {
        out.push({ date: d, type: "bill", refId: rec.id, label: `Bill ${rec.amount}` });
      }
    }
  }
  for (const ev of data.events) {
    // single-day or multi-day
    let cur = ev.startDate;
    while (cur <= ev.endDate && cur <= range.end) {
      if (cur >= range.start) {
        out.push({ date: cur, type: "event", refId: ev.id, label: ev.title });
      }
      if (cur === ev.endDate) break;
      cur = addDays(cur, 1);
    }
  }
  for (const g of data.gifts) {
    if (g.date >= range.start && g.date <= range.end) {
      out.push({ date: g.date, type: "gift", refId: g.id, label: `Gift for ${g.recipient}` });
    }
  }
  for (const r of data.reminders) {
    if (r.dueDate >= range.start && r.dueDate <= range.end && r.status === "pending") {
      out.push({ date: r.dueDate, type: "reminder", refId: r.id, label: r.title });
    }
  }
  for (const goal of data.goals) {
    if (goal.deadline && goal.deadline >= range.start && goal.deadline <= range.end) {
      out.push({ date: goal.deadline, type: "goal", refId: goal.id, label: goal.title });
    }
  }
  // Family birthdays yearly
  for (const fm of data.familyMembers) {
    if (!fm.birthday) continue;
    // Birthday stored as YYYY-MM-DD, we consider MM-DD yearly
    const [, mm, dd] = fm.birthday.split("-");
    const startY = parseInt(range.start.slice(0, 4), 10);
    const endY = parseInt(range.end.slice(0, 4), 10);
    for (let y = startY; y <= endY; y++) {
      const d = `${y}-${mm}-${dd}`;
      if (d >= range.start && d <= range.end) {
        out.push({ date: d, type: "event", refId: fm.id, label: `${fm.name} birthday` });
      }
    }
  }

  return out;
}

export function getDayDetail(
  date: ISODateString,
  data: CalendarDataSnapshot
): {
  expenses: Expense[];
  incomes: Income[];
  events: Event[];
  gifts: Gift[];
  reminders: Reminder[];
  occurrences: CalendarOccurrence[];
  totalSpent: number;
  totalIncome: number;
} {
  const expenses = data.expenses.filter((e) => e.date === date);
  const incomes = data.incomes.filter((i) => i.date === date);
  const events = data.events.filter((ev) => date >= ev.startDate && date <= ev.endDate);
  const gifts = data.gifts.filter((g) => g.date === date);
  const reminders = data.reminders.filter((r) => r.dueDate === date);
  const occurrences = getOccurrencesInRange({ start: date, end: date }, data);
  return {
    expenses,
    incomes,
    events,
    gifts,
    reminders,
    occurrences,
    totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
    totalIncome: incomes.reduce((s, i) => s + i.amount, 0),
  };
}
