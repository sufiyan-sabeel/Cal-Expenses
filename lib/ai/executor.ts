/**
 * AIActionExecutor — ONLY entry point for AI writes. Calls same services as manual UI.
 */
import { ExpenseService } from "../services/expense.service";
import { IncomeService } from "../services/income.service";
import { BudgetService } from "../services/budget.service";
import { EventService } from "../services/event.service";
import { CategoryService } from "../services/category.service";
import { GoalService } from "../services/goal.service";
import type { ParsedIntent } from "./intent";
import { todayISODate } from "../domain/common";

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: unknown;
  requiresConfirmation?: boolean;
  confirmationPreview?: unknown;
}

export function executeIntent(intent: ParsedIntent): ExecutionResult {
  try {
    switch (intent.intent) {
      case "create_expense": {
        const amount = intent.entities.amount as number;
        const categoryName = (intent.entities.category as string) ?? "Other";
        const date = (intent.entities.date as string) ?? todayISODate();
        const description = (intent.entities.description as string) ?? intent.raw;
        // resolve category
        const cats = CategoryService.getAll();
        let cat = cats.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!cat) cat = cats.find((c) => c.name === "Other")!;
        // For quick-add-undo mode, this returns preview but actual creation is done by caller after confirmation decision
        // Here we provide preview object
        const preview = { amount, categoryId: cat.id, categoryName: cat.name, date, description };
        return { success: true, message: `Ready to create expense ₹${amount} for ${cat.name} on ${date}`, data: preview, requiresConfirmation: false, confirmationPreview: preview };
      }
      case "create_income": {
        const amount = intent.entities.amount as number;
        const date = (intent.entities.date as string) ?? todayISODate();
        const cats = CategoryService.getAll().filter((c) => c.type === "income" || c.type === "both");
        const cat = cats[0]!;
        const preview = { amount, sourceCategoryId: cat.id, date, description: intent.raw.slice(0, 100) };
        return { success: true, message: `Ready to create income ₹${amount} on ${date}`, data: preview, requiresConfirmation: false, confirmationPreview: preview };
      }
      case "create_budget": {
        const amount = intent.entities.amount as number;
        const name = (intent.entities.name as string) ?? "New Budget";
        // need category selection — default to first expense category
        const cats = CategoryService.getAll().filter((c) => c.type === "expense");
        const cat = cats.find((c) => c.name === "Food") ?? cats[0]!;
        const start = new Date().toISOString().slice(0, 10);
        // end is month end
        const d = new Date();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
        return {
          success: true,
          message: `Ready to create budget "${name}" ₹${amount} for ${cat.name}`,
          data: { amount, name, categoryId: cat.id, scope: "category", periodStart: start, periodEnd: end },
          requiresConfirmation: true,
          confirmationPreview: { amount, name, category: cat.name, period: `${start} to ${end}` },
        };
      }
      case "create_event": {
        const title = (intent.entities.title as string) ?? intent.raw.slice(0, 40);
        const date = (intent.entities.date as string) ?? todayISODate();
        return {
          success: true,
          message: `Ready to create event "${title}" on ${date}`,
          data: { title, startDate: date, endDate: date, templateType: "other" },
          requiresConfirmation: true,
          confirmationPreview: { title, date },
        };
      }
      case "create_goal": {
        const amount = intent.entities.amount as number;
        const title = (intent.entities.title as string) ?? "Savings Goal";
        return {
          success: true,
          message: `Ready to create goal "${title}" target ₹${amount}`,
          data: { title, targetAmount: amount },
          requiresConfirmation: true,
          confirmationPreview: { title, targetAmount: amount },
        };
      }
      case "query_spending":
      case "query_budget_status":
      case "query_upcoming":
      case "general_help":
        return { success: true, message: "Read query — no confirmation needed", requiresConfirmation: false };
      default:
        return { success: false, message: "I didn't understand that. Try: 'Spent ₹250 on lunch today' or 'Show my food spending this month'." };
    }
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export function commitExpenseFromPreview(preview: { amount: number; categoryId: string; date: string; description: string }): ExecutionResult {
  try {
    const exp = ExpenseService.create({
      amount: preview.amount,
      currency: "INR",
      categoryId: preview.categoryId,
      subcategory: null,
      date: preview.date,
      time: null,
      merchant: null,
      description: preview.description,
      paymentMethod: null,
      tags: [],
      notes: null,
      recurringSourceId: null,
      eventId: null,
      giftId: null,
      createdVia: "ai",
    });
    return { success: true, message: `Expense created: ₹${exp.amount}`, data: exp };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export function commitIncomeFromPreview(preview: { amount: number; sourceCategoryId: string; date: string; description: string }): ExecutionResult {
  try {
    const inc = IncomeService.create({
      amount: preview.amount,
      currency: "INR",
      sourceCategoryId: preview.sourceCategoryId,
      date: preview.date,
      description: preview.description,
      notes: null,
      recurringSourceId: null,
      refundOfExpenseId: null,
      createdVia: "ai",
    });
    return { success: true, message: `Income created: ₹${inc.amount}`, data: inc };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export function commitBudgetFromPreview(preview: { amount: number; name: string; categoryId: string; scope: string; periodStart: string; periodEnd: string }): ExecutionResult {
  try {
    const b = BudgetService.create({
      name: preview.name,
      scope: preview.scope as any,
      categoryId: preview.categoryId,
      eventId: null,
      familyMemberIds: [],
      amount: preview.amount,
      periodStart: preview.periodStart,
      periodEnd: preview.periodEnd,
      recurring: false,
      rollover: false,
      rolloverMode: "both",
      alertThresholds: [80, 100],
    });
    return { success: true, message: `Budget created: ${b.name}`, data: b };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export function commitEventFromPreview(preview: { title: string; startDate: string; endDate: string; templateType: string }): ExecutionResult {
  try {
    const ev = EventService.create({
      title: preview.title,
      templateType: preview.templateType as any,
      startDate: preview.startDate,
      endDate: preview.endDate,
      time: null,
      location: null,
      notes: null,
      familyMemberIds: [],
      freeTextPeople: [],
      budget: null,
      plannedExpenses: [],
      reminderDaysBefore: 3,
    });
    return { success: true, message: `Event created: ${ev.title}`, data: ev };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export function commitGoalFromPreview(preview: { title: string; targetAmount: number }): ExecutionResult {
  try {
    const g = GoalService.create({ title: preview.title, targetAmount: preview.targetAmount, deadline: null });
    return { success: true, message: `Goal created: ${g.title}`, data: g };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}
