import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Gift } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateGift } from "../validation";

export const GiftService = {
  getAll(): Gift[] {
    return loadListSync<Gift>(StorageKeys.gifts).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  getById(id: string): Gift | undefined {
    return loadListSync<Gift>(StorageKeys.gifts).find((g) => g.id === id);
  },
  create(data: Omit<Gift, "id" | "createdAt" | "updatedAt">): Gift {
    const r = validateGift({ recipient: data.recipient, budget: data.budget, date: data.date });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const gift: Gift = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<Gift>(StorageKeys.gifts);
    saveListSync(StorageKeys.gifts, [...all, gift]);
    return gift;
  },
  update(id: string, patch: Partial<Gift>): Gift {
    const all = loadListSync<Gift>(StorageKeys.gifts);
    const idx = all.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error("Gift not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Gift;
    all[idx] = merged;
    saveListSync(StorageKeys.gifts, all);
    return merged;
  },
  markPurchased(id: string, actualCost: number, linkedExpenseId?: string | null): Gift {
    if (actualCost <= 0) throw new Error("Actual cost must be >0");
    return this.update(id, { purchasedStatus: "purchased", actualCost, linkedExpenseId: linkedExpenseId ?? null });
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Gift>(StorageKeys.gifts);
    saveListSync(StorageKeys.gifts, all.filter((g) => g.id !== id));
  },
};
