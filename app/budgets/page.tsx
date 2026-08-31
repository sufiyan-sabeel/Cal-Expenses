"use client";
import React, { useState } from "react";
import { BudgetService } from "@/lib/services/budget.service";
import { CategoryService } from "@/lib/services/category.service";
import { ExpenseService } from "@/lib/services/expense.service";
import { GiftService } from "@/lib/services/gift.service";
import { Input, Select } from "@/components/ui/input";
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
    if (!amount || amount <= 0) { toast("Amount >0 required", "error"); return; }
    try {
      BudgetService.create({ name: form.name, scope: form.scope, categoryId: form.categoryId || null, eventId: null, familyMemberIds: [], amount, periodStart: form.periodStart, periodEnd: form.periodEnd, recurring: false, rollover: false, rolloverMode: "both", alertThresholds: [80, 100] });
      toast("Budget created", "success"); setShow(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Budgets</h1><Button onClick={() => setShow(true)}>+ New Budget</Button></div>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">Create budget</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Food budget" />
            <Input label="Amount *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Scope" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as any })}>
              <option value="category">Category</option>
              <option value="custom">Custom date range</option>
              <option value="event">Event</option>
            </Select>
            <Select label="Category (if category scope)" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select</option>
              {categories.filter((c) => c.type !== "income").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Period start" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
            <Input label="Period end" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Create</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {budgets.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No budget set for this category — create one to track it here.</p></Card> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {budgets.map((b) => {
            const expenses = ExpenseService.getAll();
            const gifts = GiftService.getAll();
            const spent = (() => {
              if (b.scope === "category" && b.categoryId) return expenses.filter((e) => e.categoryId === b.categoryId && e.date >= b.periodStart && (!b.periodEnd || e.date <= b.periodEnd)).reduce((s, e) => s + e.amount, 0);
              if (b.scope === "custom") return expenses.filter((e) => e.date >= b.periodStart && (!b.periodEnd || e.date <= b.periodEnd)).reduce((s, e) => s + e.amount, 0);
              return 0;
            })();
            const pct = b.amount ? (spent / b.amount) * 100 : 0;
            const capped = Math.min(pct, 100);
            const remaining = b.amount - spent;
            return (
              <Card key={b.id}>
                <div className="flex justify-between"><h4 className="font-medium">{b.name}</h4><Button variant="destructive" size="sm" onClick={() => setDel(b.id)}>Delete</Button></div>
                <p className="text-xs text-[var(--text-tertiary)]">{b.scope} · {b.periodStart} → {b.periodEnd ?? "ongoing"}</p>
                <div className="h-2 bg-[var(--surface-elevated-2)] rounded-full mt-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${capped}%`, background: pct >= 100 ? "var(--semantic-danger)" : pct >= 80 ? "var(--semantic-warning)" : "var(--semantic-income)" }} />
                </div>
                <div className="flex justify-between text-xs mt-1"><span className="tabular-nums">{pct.toFixed(0)}% used</span><span className="tabular-nums">{spent.toFixed(0)} / {b.amount.toFixed(0)}</span></div>
                <div className="text-sm mt-1">Remaining: <span className={`tabular-nums font-medium ${remaining < 0 ? "text-[var(--semantic-danger)]" : ""}`}>₹{remaining.toFixed(2)}</span> {remaining < 0 && <span className="text-xs text-[var(--semantic-danger)]">over by ₹{Math.abs(remaining).toFixed(0)}</span>}</div>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete budget?" description="Delete this budget permanently?" confirmLabel="Delete" onConfirm={() => { if (del) { BudgetService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
