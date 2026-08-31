import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Reminder } from "../domain/models";
import { generateId, nowIso } from "../domain/common";

export const ReminderService = {
  getAll(): Reminder[] {
    return loadListSync<Reminder>(StorageKeys.reminders).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  },
  create(data: Omit<Reminder, "id" | "createdAt" | "updatedAt">): Reminder {
    const now = nowIso();
    const r: Reminder = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Reminder>(StorageKeys.reminders);
    saveListSync(StorageKeys.reminders, [...all, r]);
    return r;
  },
  update(id: string, patch: Partial<Reminder>): Reminder {
    const all = loadListSync<Reminder>(StorageKeys.reminders);
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reminder not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Reminder;
    all[idx] = merged;
    saveListSync(StorageKeys.reminders, all);
    return merged;
  },
  dismiss(id: string): Reminder {
    return this.update(id, { status: "dismissed" });
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Reminder>(StorageKeys.reminders);
    saveListSync(StorageKeys.reminders, all.filter((r) => r.id !== id));
  },
};
