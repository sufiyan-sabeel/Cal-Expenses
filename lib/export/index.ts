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

export function shareBlob(blob: Blob, filename: string, title: string): boolean {
  const file = new File([blob], filename, { type: blob.type });
  // @ts-ignore — Web Share API Level 2
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    // @ts-ignore
    navigator.share({ files: [file], title, text: title }).catch(() => {});
    return true;
  }
  if (navigator.share) {
    // fallback text share
    navigator.share({ title, text: `${title} — ${filename}` }).catch(() => {});
    return true;
  }
  return false;
}

export function tryShareText(title: string, text: string, url?: string): boolean {
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
    return true;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(`${title}\n${text}${url ? `\n${url}` : ""}`);
    return true;
  }
  return false;
}

// PDF — client-side printable report (no server, no pdfmake dep). Generates HTML then prints/saves as PDF via browser.
export function generateReportHtml(opts: { title: string; subtitle?: string; tableHtml: string; summaryHtml: string }): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { font-family: Inter, system-ui, sans-serif; }
  body { color: #16161A; background: #fff; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #57575C; font-size: 12px; margin-bottom: 16px; }
  .summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin: 16px 0; }
  .card { border: 1px solid #E6E6E8; border-radius: 10px; padding: 12px; background: #FAFAFA; }
  .card b { display: block; font-size: 18px; }
  .card span { font-size: 11px; color: #57575C; text-transform: uppercase; letter-spacing: .06em; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #F2F2F3; padding: 8px; border-bottom: 2px solid #E6E6E8; }
  td { padding: 7px 8px; border-bottom: 1px solid #E6E6E8; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .footer { margin-top: 18px; font-size: 10px; color: #8A8A90; text-align: center; }
  @media print { .no-print { display: none; } }
</style></head><body>
  <h1>${opts.title}</h1>
  ${opts.subtitle ? `<div class="sub">${opts.subtitle}</div>` : ""}
  <div class="summary">${opts.summaryHtml}</div>
  ${opts.tableHtml}
  <div class="footer">CAL-EXPENSES — Your money. Your days. One calendar. • Generated ${new Date().toLocaleString()} • Local-only data</div>
  <script>window.onload=()=>{ setTimeout(()=>window.print(), 300); }<\/script>
</body></html>`;
}

export function printHtml(html: string): void {
  const w = window.open("", "_blank");
  if (!w) {
    // fallback download
    downloadBlob(html, "report.html", "text/html");
    return;
  }
  w.document.write(html);
  w.document.close();
}

export function buildAllExpensesReport(): { html: string; filename: string } {
  const pkg = buildExportPackage();
  const expenses = pkg.expenses.slice().sort((a, b) => a.date.localeCompare(b.date));
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categories = pkg.categories;
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + e.amount);

  const summaryHtml = `
    <div class="card"><span>Total expenses</span><b>₹${total.toFixed(2)}</b><small>${expenses.length} records</small></div>
    <div class="card"><span>Categories</span><b>${byCat.size}</b></div>
    <div class="card"><span>Period</span><b>${expenses[0]?.date ?? "—"} → ${expenses[expenses.length - 1]?.date ?? "—"}</b></div>
    <div class="card"><span>Currency</span><b>${pkg.profile?.currency ?? "INR"}</b></div>
  `;

  const rows = expenses.map((e, i) => `<tr><td>${i + 1}</td><td>${e.date}</td><td>${catMap.get(e.categoryId) ?? e.categoryId}</td><td>${(e.description ?? e.merchant ?? "").replace(/</g, "&lt;")}</td><td class="num">₹${e.amount.toFixed(2)}</td></tr>`).join("");
  const catRows = Array.from(byCat.entries()).map(([id, amt]) => `<tr><td>${catMap.get(id) ?? id}</td><td class="num">₹${amt.toFixed(2)}</td><td class="num">${((amt / total) * 100).toFixed(1)}%</td></tr>`).join("");

  const tableHtml = `
    <h3 style="margin:16px 0 8px">Category breakdown</h3>
    <table><thead><tr><th>Category</th><th class="num">Amount</th><th class="num">Share</th></tr></thead><tbody>${catRows || '<tr><td colspan="3">No data</td></tr>'}</tbody></table>
    <h3 style="margin:18px 0 8px">All expenses (${expenses.length})</h3>
    <table><thead><tr><th>#</th><th>Date</th><th>Category</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No expenses yet</td></tr>'}</tbody></table>
  `;

  const html = generateReportHtml({ title: "CAL-EXPENSES — All Expenses Report", subtitle: `Generated ${new Date().toLocaleDateString()} • ${expenses.length} expenses • Total ₹${total.toFixed(2)}`, summaryHtml, tableHtml });
  return { html, filename: `cal-expenses-all-${new Date().toISOString().slice(0, 10)}.html` };
}

export function downloadPdfReport(): void {
  const { html } = buildAllExpensesReport();
  printHtml(html);
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
