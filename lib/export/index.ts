import type { ExportPackage } from "../domain/models";
import { StorageKeys } from "../storage/keys";
import { loadListSync, loadOneSync } from "../services/base";
import type { UserProfile, Category, Expense, Income, Budget, Goal, GoalContribution, RecurringTransaction, Event, Gift, FamilyMember, Reminder, Automation, AutomationExecution, AIInsight, AppSettings } from "../domain/models";
import { nowIso } from "../domain/common";

export function buildExportPackage(): ExportPackage {
  return {
    schemaVersion: 1,
    exportedAt: nowIso(),
    profile: loadOneSync<UserProfile>(StorageKeys.profile),
    categories: loadListSync<Category>(StorageKeys.categories),
    expenses: loadListSync<Expense>(StorageKeys.expenses),
    income: loadListSync<Income>(StorageKeys.income),
    budgets: loadListSync<Budget>(StorageKeys.budgets),
    goals: loadListSync<Goal>(StorageKeys.goals),
    goalContributions: loadListSync<GoalContribution>(StorageKeys.goalContributions),
    recurringTransactions: loadListSync<RecurringTransaction>(StorageKeys.recurring),
    events: loadListSync<Event>(StorageKeys.events),
    gifts: loadListSync<Gift>(StorageKeys.gifts),
    familyMembers: loadListSync<FamilyMember>(StorageKeys.family),
    reminders: loadListSync<Reminder>(StorageKeys.reminders),
    automations: loadListSync<Automation>(StorageKeys.automations),
    automationExecutions: loadListSync<AutomationExecution>(StorageKeys.automationExecutions),
    aiInsights: loadListSync<AIInsight>(StorageKeys.aiInsights),
    settings: loadOneSync<AppSettings>(StorageKeys.settings),
  };
}

export function validateImportPackage(data: unknown): { valid: boolean; error?: string; pkg?: ExportPackage } {
  if (!data || typeof data !== "object") return { valid: false, error: "File is not valid JSON object" };
  const pkg = data as ExportPackage;
  if (typeof pkg.schemaVersion !== "number") return { valid: false, error: "Missing or invalid schemaVersion" };
  if (pkg.schemaVersion > 1) return { valid: false, error: "This file is from a newer version we cannot read. Please update the app." };
  if (!Array.isArray(pkg.expenses) || !Array.isArray(pkg.income)) return { valid: false, error: "This file isn't a valid CAL-EXPENSES backup (missing expenses/income)" };
  return { valid: true, pkg };
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const v = r[c];
        const s = v === null || v === undefined ? "" : String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export function downloadBlob(content: string | Blob, filename: string, mime: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importMerge(pkg: ExportPackage): { added: Record<string, number>; conflicts: number } {
  // Merge: add new ids not present, skip conflicts
  const existingExpenses = loadListSync<Expense>(StorageKeys.expenses);
  const existingIds = new Set(existingExpenses.map((e) => e.id));
  const toAdd = pkg.expenses.filter((e) => !existingIds.has(e.id));
  const conflicts = pkg.expenses.length - toAdd.length;
  if (toAdd.length) {
    const { getStorageSync } = require("../storage/storage-provider");
    getStorageSync().setSync(StorageKeys.expenses, [...existingExpenses, ...toAdd]);
  }
  // similar for income, budgets, etc — for brevity do generic merge for all lists
  const keysToMerge: (keyof ExportPackage)[] = ["income", "budgets", "goals", "events", "gifts", "familyMembers"];
  let totalAdded = toAdd.length;
  for (const k of keysToMerge) {
    const storeKey = (StorageKeys as any)[k === "income" ? "income" : k === "budgets" ? "budgets" : k === "goals" ? "goals" : k === "events" ? "events" : k === "gifts" ? "gifts" : "family"];
    if (!storeKey) continue;
    const existing = loadListSync<any>(storeKey);
    const existIds = new Set(existing.map((e: any) => e.id));
    const incoming = (pkg as any)[k] as any[];
    if (!Array.isArray(incoming)) continue;
    const add = incoming.filter((e) => !existIds.has(e.id));
    totalAdded += add.length;
    if (add.length) {
      const { getStorageSync } = require("../storage/storage-provider");
      getStorageSync().setSync(storeKey, [...existing, ...add]);
    }
  }
  return { added: { expenses: toAdd.length, total: totalAdded }, conflicts };
}

export function importReplace(pkg: ExportPackage): void {
  const { getStorageSync } = require("../storage/storage-provider");
  const s = getStorageSync();
  // snapshot before
  const currentPkg = buildExportPackage();
  s.setSync(StorageKeys.snapshotPreImport, currentPkg);
  s.setSync(StorageKeys.profile, pkg.profile);
  s.setSync(StorageKeys.categories, pkg.categories);
  s.setSync(StorageKeys.expenses, pkg.expenses);
  s.setSync(StorageKeys.income, pkg.income);
  s.setSync(StorageKeys.budgets, pkg.budgets);
  s.setSync(StorageKeys.goals, pkg.goals);
  s.setSync(StorageKeys.goalContributions, pkg.goalContributions);
  s.setSync(StorageKeys.recurring, pkg.recurringTransactions);
  s.setSync(StorageKeys.events, pkg.events);
  s.setSync(StorageKeys.gifts, pkg.gifts);
  s.setSync(StorageKeys.family, pkg.familyMembers);
  s.setSync(StorageKeys.reminders, pkg.reminders);
  s.setSync(StorageKeys.automations, pkg.automations);
  s.setSync(StorageKeys.automationExecutions, pkg.automationExecutions);
  s.setSync(StorageKeys.aiInsights, pkg.aiInsights);
  if (pkg.settings) s.setSync(StorageKeys.settings, pkg.settings);
}
