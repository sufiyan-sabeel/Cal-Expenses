import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Budget } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateBudget } from "../validation";

export const BudgetService = {
  getAll(): Budget[] {
    return loadListSync<Budget>(StorageKeys.budgets);
  },
  getById(id: string): Budget | undefined {
    return loadListSync<Budget>(StorageKeys.budgets).find((b) => b.id === id);
  },
  create(data: Omit<Budget, "id" | "createdAt" | "updatedAt">): Budget {
    const r = validateBudget({ amount: data.amount, name: data.name, scope: data.scope });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const b: Budget = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Budget>(StorageKeys.budgets);
    saveListSync(StorageKeys.budgets, [...all, b]);
    return b;
  },
  update(id: string, patch: Partial<Budget>): Budget {
    const all = loadListSync<Budget>(StorageKeys.budgets);
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Budget not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Budget;
    const r = validateBudget({ amount: merged.amount, name: merged.name, scope: merged.scope });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    all[idx] = merged;
    saveListSync(StorageKeys.budgets, all);
    return merged;
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Budget>(StorageKeys.budgets);
    saveListSync(StorageKeys.budgets, all.filter((b) => b.id !== id));
  },
};
