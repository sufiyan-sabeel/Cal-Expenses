/**
 * Calculation Engine — pure functions, no React, no storage.
 * Formulas per PRD §11.4 + TRD §11
 */
import type { Expense, Income, Budget, Goal, GoalContribution, Event, Gift } from "../domain/models";

export function calcCurrentBalance(
  startingBalance: number,
  incomes: Income[],
  expenses: Expense[],
  today: string // ISO date
): number {
  const incomeSum = incomes.filter((i) => i.date <= today).reduce((s, i) => s + i.amount, 0);
  const expenseSum = expenses.filter((e) => e.date <= today).reduce((s, e) => s + e.amount, 0);
  return startingBalance + incomeSum - expenseSum;
}

export function sumInPeriod(items: { date: string; amount: number }[], start: string, end: string): number {
  return items.filter((i) => i.date >= start && i.date <= end).reduce((s, i) => s + i.amount, 0);
}

export function calcMonthlyIncome(incomes: Income[], monthStart: string, monthEnd: string): number {
  return sumInPeriod(incomes, monthStart, monthEnd);
}
export function calcMonthlyExpenses(expenses: Expense[], monthStart: string, monthEnd: string): number {
  return sumInPeriod(expenses, monthStart, monthEnd);
}
export function calcMonthlySavings(monthlyIncome: number, monthlyExpenses: number): number {
  return monthlyIncome - monthlyExpenses;
}
export function calcSavingsRate(monthlySavings: number, monthlyIncome: number): number | null {
  if (monthlyIncome === 0) return null;
  return (monthlySavings / monthlyIncome) * 100;
}

export function calcCategoryUtilization(spent: number, budgetAmount: number): number {
  if (budgetAmount === 0) return 0;
  return (spent / budgetAmount) * 100;
}

export function calcOverallUtilization(budgets: Budget[], expenses: Expense[]): { utilization: number | null; unbudgetedSpend: number } {
  const budgetedCategoryIds = new Set(budgets.filter((b) => b.scope === "category" && b.categoryId).map((b) => b.categoryId!));
  const budgetTotal = budgets
    .filter((b) => b.scope === "category")
    .reduce((s, b) => s + b.amount, 0);
  if (budgetTotal === 0) return { utilization: null, unbudgetedSpend: expenses.reduce((s, e) => s + e.amount, 0) };
  // Only consider budgeted categories range: if period filter needed, caller filters expenses by period first
  const budgetedSpent = expenses.filter((e) => budgetedCategoryIds.has(e.categoryId)).reduce((s, e) => s + e.amount, 0);
  const unbudgetedSpend = expenses.filter((e) => !budgetedCategoryIds.has(e.categoryId)).reduce((s, e) => s + e.amount, 0);
  return { utilization: (budgetedSpent / budgetTotal) * 100, unbudgetedSpend };
}

export function calcSpendingTrend(currentSum: number, previousSum: number): number | "New" | "—" {
  if (previousSum === 0 && currentSum === 0) return "—";
  if (previousSum === 0 && currentSum > 0) return "New";
  return ((currentSum - previousSum) / previousSum) * 100 as number;
}

export function calcGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount === 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
}

export function calcGoalCurrentAmount(contributions: GoalContribution[], goalId: string): number {
  return contributions.filter((c) => c.goalId === goalId).reduce((s, c) => s + c.amount, 0);
}

export function calcBudgetSpent(budget: Budget, expenses: Expense[], gifts: Gift[]): number {
  if (budget.scope === "category" && budget.categoryId) {
    // if periodEnd null => recurring monthly: caller filters by period; for generic calc, sum all that fall in budget period if defined
    if (budget.periodStart && budget.periodEnd) {
      return expenses
        .filter((e) => e.categoryId === budget.categoryId && e.date >= budget.periodStart && e.date <= budget.periodEnd!)
        .reduce((s, e) => s + e.amount, 0);
    }
    if (budget.periodStart && !budget.periodEnd) {
      // recurring monthly: assume current month slice — caller should use helper for period; fallback sum all month of periodStart? We'll sum all
      return expenses.filter((e) => e.categoryId === budget.categoryId).reduce((s, e) => s + e.amount, 0);
    }
    return expenses.filter((e) => e.categoryId === budget.categoryId).reduce((s, e) => s + e.amount, 0);
  }
  if (budget.scope === "event" && budget.eventId) {
    // event budget aggregates linked expenses + gifts
    const linkedExpenseSum = expenses.filter((e) => e.eventId === budget.eventId).reduce((s, e) => s + e.amount, 0);
    const linkedGiftSum = gifts.filter((g) => g.eventId === budget.eventId && g.actualCost).reduce((s, g) => s + (g.actualCost ?? 0), 0);
    return linkedExpenseSum + linkedGiftSum;
  }
  if (budget.scope === "family" && budget.familyMemberIds.length > 0) {
    // family budgets — expenses tagged via event? For now filter expenses where event's family members match — simplified: no direct family link on expense, so 0 unless extended
    // We'll treat as 0 in generic calculation; specific view handles differently
    return 0;
  }
  if (budget.scope === "custom" && budget.periodStart && budget.periodEnd) {
    return expenses.filter((e) => e.date >= budget.periodStart && e.date <= budget.periodEnd!).reduce((s, e) => s + e.amount, 0);
  }
  return 0;
}

export function calcEventActualCost(eventId: string, expenses: Expense[], gifts: Gift[]): number {
  const expSum = expenses.filter((e) => e.eventId === eventId).reduce((s, e) => s + e.amount, 0);
  const giftSum = gifts.filter((g) => g.eventId === eventId && g.actualCost !== null).reduce((s, g) => s + (g.actualCost ?? 0), 0);
  return expSum + giftSum;
}

export function calcBudgetRemaining(budget: Budget, spent: number): number {
  return budget.amount - spent;
}

export function calcRolloverNextBudget(prevBudget: Budget, prevSpent: number): number {
  if (!prevBudget.rollover) return prevBudget.amount;
  const surplus = prevBudget.amount - prevSpent;
  if (prevBudget.rolloverMode === "surplus-only") {
    return prevBudget.amount + Math.max(0, surplus);
  }
  return prevBudget.amount + surplus;
}

// Analytics helpers
export function dailySpend(date: string, expenses: Expense[]): number {
  return expenses.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);
}

export function trailing90DayAvg(todayStr: string, expenses: Expense[]): number {
  const today = new Date(todayStr + "T00:00:00");
  let sum = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    sum += dailySpend(iso, expenses);
  }
  return sum / 90;
}

export function calendarHeatmapLevel(daily: number, avg: number): 0 | 1 | 2 | 3 | 4 {
  if (avg === 0) return daily === 0 ? 0 : 4;
  const ratio = daily / avg;
  if (ratio <= 0.25) return 0;
  if (ratio <= 0.75) return 1;
  if (ratio <= 1.25) return 2;
  if (ratio <= 2) return 3;
  return 4;
}

export function categoryShares(expenses: Expense[], periodStart: string, periodEnd: string): { categoryId: string; amount: number; share: number }[] {
  const inPeriod = expenses.filter((e) => e.date >= periodStart && e.date <= periodEnd);
  const total = inPeriod.reduce((s, e) => s + e.amount, 0);
  const byCat = new Map<string, number>();
  for (const e of inPeriod) {
    byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + e.amount);
  }
  return Array.from(byCat.entries())
    .map(([categoryId, amount]) => ({ categoryId, amount, share: total === 0 ? 0 : (amount / total) * 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export function eventVariance(event: Event, actualCost: number): number {
  if (event.budget === null) return 0;
  return actualCost - event.budget;
}

export function monthRangeFor(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T00:00:00");
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function weekRangeFor(dateStr: string, firstDay: 0 | 1 = 0): { start: string; end: string } {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = firstDay === 1 ? (day === 0 ? -6 : 1 - day) : -day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
