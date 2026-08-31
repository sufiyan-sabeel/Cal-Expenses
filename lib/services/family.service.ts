import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { FamilyMember } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { validateFamilyMember } from "../validation";

export const FamilyService = {
  getAll(): FamilyMember[] {
    return loadListSync<FamilyMember>(StorageKeys.family);
  },
  getById(id: string): FamilyMember | undefined {
    return loadListSync<FamilyMember>(StorageKeys.family).find((f) => f.id === id);
  },
  create(data: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">): FamilyMember {
    const r = validateFamilyMember({ name: data.name, birthday: data.birthday ?? undefined });
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const now = nowIso();
    const fm: FamilyMember = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    const all = loadListSync<FamilyMember>(StorageKeys.family);
    saveListSync(StorageKeys.family, [...all, fm]);
    return fm;
  },
  update(id: string, patch: Partial<FamilyMember>): FamilyMember {
    const all = loadListSync<FamilyMember>(StorageKeys.family);
    const idx = all.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("Family member not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as FamilyMember;
    all[idx] = merged;
    saveListSync(StorageKeys.family, all);
    return merged;
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<FamilyMember>(StorageKeys.family);
    saveListSync(StorageKeys.family, all.filter((f) => f.id !== id));
  },
};
