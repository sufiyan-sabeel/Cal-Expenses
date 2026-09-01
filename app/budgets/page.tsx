"use client";
import React, { useState } from "react";
import { BudgetService } from "@/lib/services/budget.service";
import { CategoryService } from "@/lib/services/category.service";
import { ExpenseService } from "@/lib/services/expense.service";
import { GiftService } from "@/lib/services/gift.service";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function BudgetsPage() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState(() => BudgetService.getAll());
  const [categories] = useState(() => CategoryService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", categoryId: "", scope: "category" as const, periodStart: new Date().toISOString().slice(0, 10), periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10) });
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setBudgets(BudgetService.getAll());
  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!form.name || form.name.length < 2) { toast("Name required", "error"); return; }
    if (!amount || amount <= 0) { toast("Enter an amount greater than ₹0", "error"); return; }
    try {
      BudgetService.create({ name: form.name, scope: form.scope, categoryId: form.categoryId || null, eventId: null, familyMemberIds: [], amount, periodStart: form.periodStart, periodEnd: form.periodEnd, recurring: false, rollover: false, rolloverMode: "both", alertThresholds: [80, 100] });
      toast("Budget created", "success"); setShow(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold" style={{ fontSize: "var(--font-size-h1)", letterSpacing: "-0.01em" }}>Budgets</h1>
        <Button onClick={() => setShow(true)} style={{ minHeight: "48px", borderRadius: "var(--radius-sm)" }}><Icon name="add" size={16} /> New Budget</Button>
      </div>

      {show && (
        <Card style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--elevation-2)" }}>
          <h3 className="font-semibold" style={{ fontSize: "var(--font-size-h3)" }}>Create budget</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div><label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Food budget" className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }} /></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Amount *</label><input type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="4000" className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold tabular-nums" style={{ borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-financial-md)" }} /></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Scope</label><select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as any })} className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }}><option value="category">Category</option><option value="custom">Custom range</option><option value="event">Event</option></select></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Category</label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }}><option value="">Select</option>{categories.filter((c) => c.type !== "income").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Start</label><input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }} /></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">End</label><input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }} /></div>
          </div>
          <div className="flex gap-2 mt-6"><Button onClick={submit} style={{ minHeight: "48px" }}>Create</Button><Button variant="secondary" onClick={() => setShow(false)} style={{ minHeight: "48px" }}>Cancel</Button></div>
        </Card>
      )}

      {budgets.length === 0 ? (
        <Card className="text-center py-10" style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-8)" }}>
          <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center"><Icon name="budgets" size={18} /></div>
          <h4 className="font-semibold mt-3" style={{ fontSize: "var(--font-size-h4)" }}>No budgets configured yet</h4>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Set one in under a minute — track spending automatically.</p>
          <Button className="mt-3" onClick={() => setShow(true)}>Create Budget</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {budgets.map((b) => {
            const expenses = ExpenseService.getAll();
            const spent = (() => {
              if (b.scope === "category" && b.categoryId) return expenses.filter((e) => e.categoryId === b.categoryId && e.date >= b.periodStart && (!b.periodEnd || e.date <= b.periodEnd)).reduce((s, e) => s + e.amount, 0);
              if (b.scope === "custom") return expenses.filter((e) => e.date >= b.periodStart && (!b.periodEnd || e.date <= b.periodEnd)).reduce((s, e) => s + e.amount, 0);
              return 0;
            })();
            const pct = b.amount ? (spent / b.amount) * 100 : 0;
            const capped = Math.min(pct, 100);
            const remaining = b.amount - spent;
            const over = pct >= 100;
            const warn = pct >= 80 && pct < 100;
            return (
              <Card key={b.id} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold" style={{ fontSize: "var(--font-size-h4)" }}>{b.name}</h4>
                    <p className="text-xs text-[var(--color-text-muted)]">₹{b.amount} budget · {b.periodStart} → {b.periodEnd ?? "ongoing"}</p>
                  </div>
                  <button onClick={() => setDel(b.id)} className="h-11 w-11 grid place-items-center rounded-md hover:bg-[var(--color-error-bg)] text-[var(--color-error)]" aria-label="Delete budget">×</button>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs"><span className="text-[var(--color-text-secondary)]">Spent ₹{spent.toFixed(0)} / ₹{b.amount.toFixed(0)}</span><span className="tabular-nums font-medium flex items-center gap-1">{pct.toFixed(0)}% {over && <Icon name="expenses" size={12} />}</span></div>
                  <div className="h-2 bg-[var(--color-surface-hover)] mt-1 overflow-hidden" style={{ borderRadius: "var(--radius-full)" }}>
                    <div className="h-full rounded-full" style={{ width: `${capped}%`, background: over ? "var(--color-error)" : warn ? "var(--color-warning)" : "var(--color-income)", transition: "width var(--motion-duration-base) var(--motion-easing-standard)" }} role="progressbar" aria-valuenow={Math.round(capped)} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                  <div className="text-xs mt-1">Remaining: <span className="font-semibold tabular-nums" style={{ color: over ? "var(--color-error)" : "var(--color-text-primary)" }}>₹{remaining.toFixed(2)}</span> {over && <span className="text-[var(--color-error)]">· over by ₹{Math.abs(remaining).toFixed(0)}</span>}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete budget?" description="This will permanently delete the budget." confirmLabel="Delete budget" onConfirm={() => { if (del) { BudgetService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
