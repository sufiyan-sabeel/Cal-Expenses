"use client";
import React, { useEffect, useState } from "react";
import { ExpenseService } from "@/lib/services/expense.service";
import { CategoryService } from "@/lib/services/category.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { todayISODate } from "@/lib/domain/common";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState(() => ExpenseService.getAll());
  const [categories] = useState(() => CategoryService.getAll().filter((c) => c.type !== "income"));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", categoryId: "", date: todayISODate(), merchant: "", description: "", paymentMethod: "" });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("");

  const refresh = () => { setExpenses(ExpenseService.getAll()); if (typeof window !== "undefined") window.dispatchEvent(new Event("calexpenses:refresh")); };
  useEffect(() => { if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "new") setShowForm(true); }, []);

  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast("Enter an amount greater than ₹0", "error"); return; }
    if (!form.categoryId) { toast("Category required", "error"); return; }
    try {
      if (editing) {
        ExpenseService.update(editing, { amount, categoryId: form.categoryId, date: form.date, merchant: form.merchant || null, description: form.description || null, paymentMethod: form.paymentMethod || null, tags: tags.split(",").map(s=>s.trim()).filter(Boolean), notes: notes || null });
        toast("Expense updated", "success");
      } else {
        const dup = ExpenseService.findPossibleDuplicate(amount, form.categoryId);
        if (dup) { if (!confirm("Possible duplicate — add anyway?")) return; }
        ExpenseService.create({ amount, currency: "INR", categoryId: form.categoryId, subcategory: null, date: form.date, time: null, merchant: form.merchant || null, description: form.description || null, paymentMethod: form.paymentMethod || null, tags: tags.split(",").map(s=>s.trim()).filter(Boolean), notes: notes || null, recurringSourceId: null, eventId: null, giftId: null, createdVia: "manual" });
        toast("Expense added", "success");
      }
      setShowForm(false); setEditing(null); setForm({ amount: "", categoryId: "", date: todayISODate(), merchant: "", description: "", paymentMethod: "" }); setTags(""); setNotes(""); setShowAdvanced(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const startEdit = (id: string) => {
    const e = ExpenseService.getById(id)!;
    setEditing(id); setForm({ amount: String(e.amount), categoryId: e.categoryId, date: e.date, merchant: e.merchant ?? "", description: e.description ?? "", paymentMethod: e.paymentMethod ?? "" }); setTags(e.tags?.join(", ") ?? ""); setNotes(e.notes ?? ""); setShowForm(true);
  };

  const filtered = filterCat ? expenses.filter((e) => e.categoryId === filterCat) : expenses;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-[26px] font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)" }}>Expenses</h1>
        <Button onClick={() => { setEditing(null); setForm({ amount: "", categoryId: categories[0]?.id ?? "", date: todayISODate(), merchant: "", description: "", paymentMethod: "" }); setShowForm(true); }} style={{ minHeight: "48px" }}><Icon name="add" size={16} /> New Expense</Button>
      </div>

      <div className="flex gap-2">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)", minHeight: "44px" }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <Card className="p-0 overflow-hidden" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--elevation-2)" }}>
          {/* Hero amount per §23 — full-screen sheet on mobile, Financial Large centered */}
          <div className="bg-[var(--color-background)] p-6 flex flex-col items-center" style={{ padding: "var(--space-6)" }}>
            <div className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">Amount</div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl text-[var(--color-text-muted)]">₹</span>
              <input
                autoFocus
                inputMode="decimal"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="bg-transparent text-center outline-none border-none font-bold tabular-nums"
                style={{ fontSize: "var(--font-size-financial-lg)", lineHeight: "1.1", letterSpacing: "-0.02em", width: "200px" }}
                aria-label="Amount"
              />
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">Tap to edit • Currency {categories.find(c=>c.id===form.categoryId)?.name ? "" : ""}</div>
          </div>

          <div className="p-4 space-y-4" style={{ padding: "var(--space-4)" }}>
            {/* Category chips horizontal scroll */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Category</label>
              <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setForm({ ...form, categoryId: c.id })}
                    className={`shrink-0 px-3 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 ${form.categoryId === c.id ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}
                    style={{ minHeight: "44px", borderRadius: "var(--radius-full)" }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this for?" className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm placeholder:text-[var(--color-text-muted)]" style={{ borderRadius: "var(--radius-sm)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Payment</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }}>
                    <option value="">Select</option>
                    <option value="UPI">UPI</option><option value="Card">Card</option><option value="Cash">Cash</option><option value="Netbanking">Netbanking</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced collapsed per §23 */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-[var(--color-brand-500)] font-medium flex items-center gap-1">
              More options <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>⌄</span>
            </button>
            {showAdvanced && (
              <div className="space-y-3 p-3 rounded-md bg-[var(--color-surface-hover)]" style={{ borderRadius: "var(--radius-md)" }}>
                <input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Merchant / Store" className="w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" />
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Attach note" rows={2} className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm" style={{ borderRadius: "var(--radius-sm)" }} />
              </div>
            )}

            {/* Sticky Save per §23 */}
            <div className="flex gap-2 pt-2 sticky bottom-0 bg-[var(--color-surface)] -mx-4 -mb-4 p-4 border-t border-[var(--color-border)]">
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1" style={{ minHeight: "48px" }}>Cancel</Button>
              <Button onClick={submit} disabled={!form.amount || parseFloat(form.amount) <= 0} className="flex-1" style={{ minHeight: "48px", borderRadius: "var(--radius-sm)" }}>{editing ? "Update" : "Save Expense"}</Button>
            </div>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-10" style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-8)" }}>
          <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center"><Icon name="expenses" size={18} /></div>
          <h4 className="font-semibold mt-3" style={{ fontSize: "var(--font-size-h4)" }}>No expenses yet</h4>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">No expenses yet — log your first one to start seeing your spending clearly.</p>
          <Button className="mt-3" onClick={() => setShowForm(true)}>Add Expense</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const cat = categories.find((c) => c.id === e.categoryId);
            return (
              <Card key={e.id} className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--radius-md)" }}>
                <div className="h-10 w-10 rounded-full grid place-items-center shrink-0" style={{ background: "var(--color-expense-bg)", color: "var(--color-expense)" }}><Icon name="expenses" size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.description ?? e.merchant ?? "Expense"}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{cat?.name} · {e.date}</div>
                </div>
                <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-expense)" }}>−₹{e.amount.toFixed(2)}</div>
                <button onClick={() => startEdit(e.id)} className="h-11 w-11 grid place-items-center rounded-md hover:bg-[var(--color-surface-hover)]" aria-label="Edit"><Icon name="settings" size={16} /></button>
                <button onClick={() => setDeleteId(e.id)} className="h-11 w-11 grid place-items-center rounded-md hover:bg-[var(--color-error-bg)] text-[var(--color-error)]" aria-label="Delete">×</button>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)} title="Delete expense?" description="This will permanently delete the expense. This action cannot be undone." confirmLabel="Delete" onConfirm={() => { if (deleteId) { ExpenseService.delete(deleteId, { confirmed: true }); toast("Deleted", "success"); setDeleteId(null); refresh(); } }} />
    </div>
  );
}
