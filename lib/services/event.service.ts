import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Event } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateEvent } from "../validation";

export const EventService = {
  getAll(): Event[] {
    return loadListSync<Event>(StorageKeys.events).sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  },
  getById(id: string): Event | undefined {
    return loadListSync<Event>(StorageKeys.events).find((e) => e.id === id);
  },
  create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Event {
    const r = validateEvent({ title: data.title, startDate: data.startDate, endDate: data.endDate });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const ev: Event = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Event>(StorageKeys.events);
    saveListSync(StorageKeys.events, [...all, ev]);
    return ev;
  },
  update(id: string, patch: Partial<Event>): Event {
    const all = loadListSync<Event>(StorageKeys.events);
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Event not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Event;
    const r = validateEvent({ title: merged.title, startDate: merged.startDate, endDate: merged.endDate });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    all[idx] = merged;
    saveListSync(StorageKeys.events, all);
    return merged;
  },
  delete(id: string, opts?: { confirmed: boolean; unlinkOnly?: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Event>(StorageKeys.events);
    saveListSync(StorageKeys.events, all.filter((e) => e.id !== id));
    if (!opts.unlinkOnly) {
      // unlink gifts/expenses by clearing eventId
      const gifts = loadListSync<any>(StorageKeys.gifts);
      let changed = false;
      for (const g of gifts) if (g.eventId === id) { g.eventId = null; g.updatedAt = nowIso(); changed = true; }
      if (changed) saveListSync(StorageKeys.gifts, gifts);
      const expenses = loadListSync<any>(StorageKeys.expenses);
      let c2 = false;
      for (const e of expenses) if (e.eventId === id) { e.eventId = null; e.updatedAt = nowIso(); c2 = true; }
      if (c2) saveListSync(StorageKeys.expenses, expenses);
    } else {
      const gifts = loadListSync<any>(StorageKeys.gifts);
      for (const g of gifts) if (g.eventId === id) g.eventId = null;
      saveListSync(StorageKeys.gifts, gifts);
      const expenses = loadListSync<any>(StorageKeys.expenses);
      for (const e of expenses) if (e.eventId === id) e.eventId = null;
      saveListSync(StorageKeys.expenses, expenses);
    }
  },
};
