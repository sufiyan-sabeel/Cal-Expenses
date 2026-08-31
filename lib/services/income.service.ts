import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Income } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateIncome } from "../validation";

export const IncomeService = {
  getAll(): Income[] {
    return loadListSync<Income>(StorageKeys.income).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  getById(id: string): Income | undefined {
    return loadListSync<Income>(StorageKeys.income).find((i) => i.id === id);
  },
  create(data: Omit<Income, "id" | "createdAt" | "updatedAt">): Income {
    const r = validateIncome({ amount: data.amount, date: data.date, sourceCategoryId: data.sourceCategoryId });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const inc: Income = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Income>(StorageKeys.income);
    saveListSync(StorageKeys.income, [...all, inc]);
    return inc;
  },
  update(id: string, patch: Partial<Income>): Income {
    const all = loadListSync<Income>(StorageKeys.income);
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Income not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Income;
    const r = validateIncome({ amount: merged.amount, date: merged.date, sourceCategoryId: merged.sourceCategoryId });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    all[idx] = merged;
    saveListSync(StorageKeys.income, all);
    return merged;
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Income>(StorageKeys.income);
    saveListSync(StorageKeys.income, all.filter((i) => i.id !== id));
  },
};
