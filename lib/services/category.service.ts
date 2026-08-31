import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import { generateId, nowIso } from "../domain/common";
import { DEFAULT_CATEGORIES, type Category } from "../domain/models";
import { validateCategory } from "../validation";

export const CategoryService = {
  getAll(): Category[] {
    let list = loadListSync<Category>(StorageKeys.categories);
    if (!list || list.length === 0) {
      const now = nowIso();
      list = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      })) as Category[];
      saveListSync<Category>(StorageKeys.categories, list);
    }
    return list;
  },
  getById(id: string): Category | undefined {
    return this.getAll().find((c) => c.id === id);
  },
  create(data: Omit<Category, "id" | "createdAt" | "updatedAt">): Category {
    const r = validateCategory(data as any);
    if (!r.valid) throw new Error(Object.values(r.errors).join("; "));
    const all = this.getAll();
    if (all.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) throw new Error("Category name already exists");
    const now = nowIso();
    const cat: Category = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    saveListSync(StorageKeys.categories, [...all, cat]);
    return cat;
  },
  update(id: string, patch: Partial<Category>): Category {
    const all = this.getAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    const updated = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Category;
    all[idx] = updated;
    saveListSync(StorageKeys.categories, all);
    return updated;
  },
  delete(id: string): void {
    const all = this.getAll();
    const cat = all.find((c) => c.id === id);
    if (!cat) return;
    if (cat.isSystem) throw new Error("System categories cannot be deleted");
    // Check if in use
    // We check expenses/income lazily via storage
    // If in use, caller should handle reassign; here we block if in use?
    // For now allow but caller must reassign. We'll just filter.
    // Import expense service to check? Avoid circular. Do direct load.
    const { loadListSync } = require("./base");
    const { StorageKeys } = require("../storage/keys");
    const expenses = loadListSync(StorageKeys.expenses) as any[];
    const incomes = loadListSync(StorageKeys.income) as any[];
    const inUse = expenses.some((e: any) => e.categoryId === id) || incomes.some((i: any) => i.sourceCategoryId === id);
    if (inUse) throw new Error("Category is in use. Reassign transactions before deleting.");
    saveListSync(StorageKeys.categories, all.filter((c) => c.id !== id));
  },
};
