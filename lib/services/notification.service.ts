import { ExpenseService } from "./expense.service";
import { BudgetService } from "./budget.service";
import { GiftService } from "./gift.service";
import { EventService } from "./event.service";
import { RecurringService } from "./recurring.service";
import { GoalService } from "./goal.service";
import { ReminderService } from "./reminder.service";
import { todayISODate } from "@/lib/domain/common";
import { calcBudgetSpent } from "@/lib/calculations";
import type { Gift, Event, Budget } from "@/lib/domain/models";

export type AppNotification = {
  id: string;
  type: "bill" | "event" | "gift" | "budget" | "goal" | "reminder";
  title: string;
  message: string;
  date?: string;
  href: string;
  unread: boolean;
};

export const NotificationService = {
  getAll(): AppNotification[] {
    const today = todayISODate();
    const notifications: AppNotification[] = [];
    const readIds = (() => {
      try { return new Set(JSON.parse(localStorage.getItem("calexpenses:v1:readNotifications") ?? "[]") as string[]); } catch { return new Set<string>(); }
    })();

    // Upcoming bills (recurring)
    const recurring = RecurringService.getAll().filter((r) => r.status === "active" && r.nextOccurrenceDate);
    for (const r of recurring) {
      if (!r.nextOccurrenceDate) continue;
      const diff = Math.round((new Date(r.nextOccurrenceDate + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
      if (diff >= 0 && diff <= 7) {
        notifications.push({
          id: `bill-${r.id}`,
          type: "bill",
          title: `${r.type === "expense" ? "Bill due" : "Income expected"} in ${diff === 0 ? "today" : `${diff}d`}`,
          message: `₹${r.amount} · ${r.frequency} · ${r.nextOccurrenceDate}`,
          date: r.nextOccurrenceDate,
          href: "/recurring",
          unread: !readIds.has(`bill-${r.id}`),
        });
      }
    }

    // Upcoming events
    const events = EventService.getAll();
    for (const e of events) {
      const diff = Math.round((new Date(e.startDate + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
      if (diff >= 0 && diff <= 14) {
        notifications.push({
          id: `event-${e.id}`,
          type: "event",
          title: e.title,
          message: `${e.templateType} · ${e.startDate}${e.endDate !== e.startDate ? ` → ${e.endDate}` : ""}`,
          date: e.startDate,
          href: "/events",
          unread: !readIds.has(`event-${e.id}`),
        });
      }
    }

    // Gifts due
    const gifts = GiftService.getAll().filter((g) => g.purchasedStatus === "planned");
    for (const g of gifts) {
      const diff = Math.round((new Date(g.date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
      if (diff >= 0 && diff <= 7) {
        notifications.push({
          id: `gift-${g.id}`,
          type: "gift",
          title: `Gift for ${g.recipient}`,
          message: `${g.occasion} · budget ₹${g.budget} · ${g.date}`,
          date: g.date,
          href: "/gifts",
          unread: !readIds.has(`gift-${g.id}`),
        });
      }
    }

    // Budget thresholds
    const expenses = ExpenseService.getAll();
    const allGifts = GiftService.getAll();
    const budgets = BudgetService.getAll();
    for (const b of budgets) {
      const spent = calcBudgetSpent(b, expenses, allGifts);
      const pct = b.amount ? (spent / b.amount) * 100 : 0;
      if (pct >= 80) {
        const over = pct >= 100;
        notifications.push({
          id: `budget-${b.id}`,
          type: "budget",
          title: over ? `Over budget: ${b.name}` : `Budget 80%: ${b.name}`,
          message: `${pct.toFixed(0)}% used · ₹${spent.toFixed(0)} / ₹${b.amount}`,
          href: "/budgets",
          unread: !readIds.has(`budget-${b.id}`),
        });
      }
    }

    // Goals
    const goals = GoalService.getAll();
    for (const g of goals) {
      const current = GoalService.currentAmount(g.id);
      const pct = g.targetAmount ? (current / g.targetAmount) * 100 : 0;
      if (pct >= 100) {
        notifications.push({
          id: `goal-${g.id}`,
          type: "goal",
          title: `Goal achieved: ${g.title}`,
          message: `₹${current} / ₹${g.targetAmount} · ${pct.toFixed(0)}%`,
          href: "/goals",
          unread: !readIds.has(`goal-${g.id}`),
        });
      } else if (g.deadline && g.deadline < today && current < g.targetAmount) {
        notifications.push({
          id: `goal-overdue-${g.id}`,
          type: "goal",
          title: `Goal overdue: ${g.title}`,
          message: `Due ${g.deadline} · ₹${current}/${g.targetAmount}`,
          href: "/goals",
          unread: !readIds.has(`goal-overdue-${g.id}`),
        });
      }
    }

    // Reminders pending
    const reminders = ReminderService.getAll().filter((r) => r.status === "pending");
    for (const r of reminders.slice(0, 5)) {
      notifications.push({
        id: `reminder-${r.id}`,
        type: "reminder",
        title: r.title,
        message: `Due ${r.dueDate}`,
        date: r.dueDate,
        href: "/calendar",
        unread: !readIds.has(`reminder-${r.id}`),
      });
    }

    // Sort unread first, then by date
    return notifications.sort((a, b) => (Number(b.unread) - Number(a.unread)) || (a.date ?? "").localeCompare(b.date ?? ""));
  },

  markRead(id: string) {
    const raw = localStorage.getItem("calexpenses:v1:readNotifications");
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem("calexpenses:v1:readNotifications", JSON.stringify(arr));
    }
  },

  markAllRead() {
    const all = this.getAll().map((n) => n.id);
    localStorage.setItem("calexpenses:v1:readNotifications", JSON.stringify(all));
  },

  clearAllRead() {
    localStorage.removeItem("calexpenses:v1:readNotifications");
  },
};
