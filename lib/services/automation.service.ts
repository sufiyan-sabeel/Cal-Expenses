import { StorageKeys } from "../storage/keys";
import { loadListSync, saveListSync } from "./base";
import type { Automation, AutomationExecution } from "../domain/models";
import { generateId, nowIso } from "../domain/common";

export const AutomationService = {
  getAll(): Automation[] {
    return loadListSync<Automation>(StorageKeys.automations);
  },
  getExecutions(): AutomationExecution[] {
    return loadListSync<AutomationExecution>(StorageKeys.automationExecutions);
  },
  create(data: Omit<Automation, "id" | "createdAt" | "updatedAt" | "lastRunAt" | "lastRunStatus" | "failureReason">): Automation {
    const now = nowIso();
    const a: Automation = { ...data, id: generateId(), createdAt: now, updatedAt: now, lastRunAt: null, lastRunStatus: null, failureReason: null };
    const all = loadListSync<Automation>(StorageKeys.automations);
    saveListSync(StorageKeys.automations, [...all, a]);
    return a;
  },
  update(id: string, patch: Partial<Automation>): Automation {
    const all = loadListSync<Automation>(StorageKeys.automations);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Automation not found");
    const merged = { ...all[idx]!, ...patch, updatedAt: nowIso() } as Automation;
    all[idx] = merged;
    saveListSync(StorageKeys.automations, all);
    return merged;
  },
  delete(id: string, opts?: { confirmed: boolean }): void {
    if (!opts?.confirmed) throw new Error("Delete requires confirmation");
    const all = loadListSync<Automation>(StorageKeys.automations);
    saveListSync(StorageKeys.automations, all.filter((a) => a.id !== id));
  },
  toggle(id: string): Automation {
    const a = this.getAll().find((x) => x.id === id);
    if (!a) throw new Error("Not found");
    return this.update(id, { enabled: !a.enabled });
  },
  logExecution(automationId: string, result: "success" | "failed", detail: string): AutomationExecution {
    const now = nowIso();
    const e: AutomationExecution = { id: generateId(), automationId, firedAt: now, result, detail, createdAt: now, updatedAt: now };
    const all = loadListSync<AutomationExecution>(StorageKeys.automationExecutions);
    saveListSync(StorageKeys.automationExecutions, [...all, e]);
    // update automation last run
    const a = this.getAll().find((x) => x.id === automationId);
    if (a) this.update(automationId, { lastRunAt: now, lastRunStatus: result, failureReason: result === "failed" ? detail : null });
    return e;
  },
};
