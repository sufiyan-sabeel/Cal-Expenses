import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Goal, GoalContribution } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateGoal } from "../validation";

export const GoalService = {
  getAll(): Goal[] {
    return loadListSync<Goal>(StorageKeys.goals);
  },
  getContributions(): GoalContribution[] {
    return loadListSync<GoalContribution>(StorageKeys.goalContributions);
  },
  getContributionsForGoal(goalId: string): GoalContribution[] {
    return this.getContributions().filter((c) => c.goalId === goalId);
  },
  currentAmount(goalId: string): number {
    return this.getContributionsForGoal(goalId).reduce((s, c) => s + c.amount, 0);
  },
  create(data: Omit<Goal, "id" | "createdAt" | "updatedAt" | "status"> & { status?: Goal["status"] }): Goal {
    const r = validateGoal({ targetAmount: data.targetAmount, title: data.title, deadline: data.deadline ?? undefined });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const g: Goal = { ...data, status: data.status ?? "active", id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Goal>(StorageKeys.goals);
    saveListSync(StorageKeys.goals, [...all, g]);
    return g;
  },
  update(id: string, patch: Partial<Goal>): Goal {
    const all = loadListSync<Goal>(StorageKeys.goals);
    const idx = all.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error("Goal not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Goal;
    all[idx] = merged;
    saveListSync(StorageKeys.goals, all);
    return merged;
  },
  addContribution(goalId: string, amount: number, date: string, note?: string | null, linkedIncomeId?: string | null): GoalContribution {
    if (amount <= 0) throw new Error("Contribution must be >0");
    const now = nowIso();
    const c: GoalContribution = { id: generateId(), goalId, amount, date, note: note ?? null, linkedIncomeId: linkedIncomeId ?? null, createdAt: now, updatedAt: now };
    const all = loadListSync<GoalContribution>(StorageKeys.goalContributions);
    saveListSync(StorageKeys.goalContributions, [...all, c]);
    // check achieved
    const total = [...all, c].filter((x) => x.goalId === goalId).reduce((s, x) => s + x.amount, 0);
    const goals = loadListSync<Goal>(StorageKeys.goals);
    const gIdx = goals.findIndex((g) => g.id === goalId);
    if (gIdx !== -1) {
      const g = goals[gIdx]!;
      if (total >= g.targetAmount && g.status === "active") {
        goals[gIdx] = { ...g, status: "achieved", updatedAt: nowIso() };
        saveListSync(StorageKeys.goals, goals);
      }
    }
    return c;
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Goal>(StorageKeys.goals);
    saveListSync(StorageKeys.goals, all.filter((g) => g.id !== id));
    // contributions remain? spec says delete goal deletes contributions ledger only
    const contribs = loadListSync<GoalContribution>(StorageKeys.goalContributions);
    saveListSync(StorageKeys.goalContributions, contribs.filter((c) => c.goalId !== id));
  },
};
