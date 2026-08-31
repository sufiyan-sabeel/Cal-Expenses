import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { RecurringTransaction } from "../domain/models";
import { generateId, nowIso, todayISODate } from "../domain/common";
import { validateRecurring } from "../validation";

function computeNextOccurrence(rec: RecurringTransaction): string | null {
  if (rec.status !== "active") return null;
  if (rec.endDate && rec.startDate > rec.endDate) return null;
  // Simplified: lastGeneratedDate + interval, or startDate if never generated
  const base = rec.lastGeneratedDate ?? rec.startDate;
  if (!rec.lastGeneratedDate) return rec.startDate;
  const d = new Date(base + "T00:00:00");
  if (rec.frequency === "daily") d.setDate(d.getDate() + 1);
  else if (rec.frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (rec.frequency === "biweekly") d.setDate(d.getDate() + 14);
  else if (rec.frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (rec.frequency === "yearly") d.setFullYear(d.getFullYear() + 1);
  else if (rec.frequency === "custom" && rec.customIntervalDays) d.setDate(d.getDate() + rec.customIntervalDays);
  const iso = d.toISOString().slice(0, 10);
  if (rec.endDate && iso > rec.endDate) return null;
  return iso;
}

export const RecurringService = {
  getAll(): RecurringTransaction[] {
    return loadListSync<RecurringTransaction>(StorageKeys.recurring);
  },
  getById(id: string): RecurringTransaction | undefined {
    return loadListSync<RecurringTransaction>(StorageKeys.recurring).find((r) => r.id === id);
  },
  create(data: Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt" | "nextOccurrenceDate" | "lastGeneratedDate">): RecurringTransaction {
    const r = validateRecurring({ amount: data.amount, startDate: data.startDate, frequency: data.frequency, customIntervalDays: data.customIntervalDays });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const rec: RecurringTransaction = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      lastGeneratedDate: null,
      nextOccurrenceDate: data.startDate,
      status: data.status ?? "active",
    };
    const all = loadListSync<RecurringTransaction>(StorageKeys.recurring);
    saveListSync(StorageKeys.recurring, [...all, rec]);
    return rec;
  },
  update(id: string, patch: Partial<RecurringTransaction>): RecurringTransaction {
    const all = loadListSync<RecurringTransaction>(StorageKeys.recurring);
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Recurring not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as RecurringTransaction;
    // recompute next if start changed or status resumed
    if (patch.startDate || patch.frequency || patch.status === "active") {
      merged.nextOccurrenceDate = computeNextOccurrence(merged) ?? merged.startDate;
      if (merged.status === "active" && merged.nextOccurrenceDate && merged.nextOccurrenceDate < todayISODate()) {
        // if next is past, set to today-forward logic simplified
        merged.nextOccurrenceDate = todayISODate();
      }
    }
    all[idx] = merged;
    saveListSync(StorageKeys.recurring, all);
    return merged;
  },
  togglePause(id: string): RecurringTransaction {
    const rec = this.getById(id);
    if (!rec) throw new Error("Not found");
    const newStatus = rec.status === "active" ? "paused" : "active";
    return this.update(id, { status: newStatus, nextOccurrenceDate: newStatus === "active" ? (computeNextOccurrence({ ...rec, status: "active" }) ?? rec.startDate) : rec.nextOccurrenceDate });
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<RecurringTransaction>(StorageKeys.recurring);
    saveListSync(StorageKeys.recurring, all.filter((r) => r.id !== id));
  },
  // Call after generating an expense/income from recurring
  markGenerated(id: string, date: string): void {
    this.update(id, { lastGeneratedDate: date, nextOccurrenceDate: computeNextOccurrence({ ...this.getById(id)!, lastGeneratedDate: date } as RecurringTransaction) });
  },
};
