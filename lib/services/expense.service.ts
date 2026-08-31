import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Expense } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateExpense } from "../validation";

export const ExpenseService = {
  getAll(): Expense[] {
    return loadListSync<Expense>(StorageKeys.expenses).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  getById(id: string): Expense | undefined {
    return loadListSync<Expense>(StorageKeys.expenses).find((e) => e.id === id);
  },
  getByDate(date: string): Expense[] {
    return loadListSync<Expense>(StorageKeys.expenses).filter((e) => e.date === date);
  },
  // Duplicate detection: same amount + category within 5 minutes window (using createdAt)
  findPossibleDuplicate(amount: number, categoryId: string): Expense | undefined {
    const all = loadListSync<Expense>(StorageKeys.expenses);
    const now = Date.now();
    return all.find((e) => e.amount === amount && e.categoryId === categoryId && Math.abs(now - new Date(e.createdAt).getTime()) < 5 * 60 * 1000);
  },
  create(data: Omit<Expense, "id" | "createdAt" | "updatedAt">): Expense {
    const r = validateExpense({ amount: data.amount, date: data.date, categoryId: data.categoryId });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const expense: Expense = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Expense>(StorageKeys.expenses);
    saveListSync(StorageKeys.expenses, [...all, expense]);
    return expense;
  },
  update(id: string, patch: Partial<Expense>): Expense {
    const all = loadListSync<Expense>(StorageKeys.expenses);
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Expense not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Expense;
    const r = validateExpense({ amount: merged.amount, date: merged.date, categoryId: merged.categoryId });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    all[idx] = merged;
    saveListSync(StorageKeys.expenses, all);
    return merged;
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Expense>(StorageKeys.expenses);
    saveListSync(StorageKeys.expenses, all.filter((e) => e.id !== id));
  },
  deleteMany(ids: string[], opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Bulk delete requires confirmation");
    const all = loadListSync<Expense>(StorageKeys.expenses);
    const set = new Set(ids);
    saveListSync(StorageKeys.expenses, all.filter((e) => !set.has(e.id)));
  },
  clearAll(confirmed: boolean): void {
    if (!confirmed) throw new Error("Clear requires confirmation");
    saveListSync(StorageKeys.expenses, []);
  },
};
