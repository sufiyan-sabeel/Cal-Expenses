"use client";
import React, { useEffect, useState } from "react";
import { ExpenseService } from "@/lib/services/expense.service";
import { CategoryService } from "@/lib/services/category.service";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("");

  const refresh = () => { setExpenses(ExpenseService.getAll()); if (typeof window !== "undefined") window.dispatchEvent(new Event("calexpenses:refresh")); };

  useEffect(() => { if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "new") setShowForm(true); }, []);

  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast("Amount must be >0", "error"); return; }
    if (!form.categoryId) { toast("Category required", "error"); return; }
    try {
      if (editing) {
        ExpenseService.update(editing, { amount, categoryId: form.categoryId, date: form.date, merchant: form.merchant || null, description: form.description || null, paymentMethod: form.paymentMethod || null });
        toast("Expense updated", "success");
      } else {
        const dup = ExpenseService.findPossibleDuplicate(amount, form.categoryId);
        if (dup) {
          if (!confirm("Possible duplicate — add anyway?")) return;
        }
        ExpenseService.create({ amount, currency: "INR", categoryId: form.categoryId, subcategory: null, date: form.date, time: null, merchant: form.merchant || null, description: form.description || null, paymentMethod: form.paymentMethod || null, tags: [], notes: null, recurringSourceId: null, eventId: null, giftId: null, createdVia: "manual" });
        toast("Expense added", "success");
      }
      setShowForm(false); setEditing(null); setForm({ amount: "", categoryId: "", date: todayISODate(), merchant: "", description: "", paymentMethod: "" }); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const startEdit = (id: string) => {
    const e = ExpenseService.getById(id)!;
    setEditing(id); setForm({ amount: String(e.amount), categoryId: e.categoryId, date: e.date, merchant: e.merchant ?? "", description: e.description ?? "", paymentMethod: e.paymentMethod ?? "" }); setShowForm(true);
  };

  const filtered = filterCat ? expenses.filter((e) => e.categoryId === filterCat) : expenses;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <Button onClick={() => { setEditing(null); setForm({ amount: "", categoryId: categories[0]?.id ?? "", date: todayISODate(), merchant: "", description: "", paymentMethod: "" }); setShowForm(true); }}>+ New Expense</Button>
      </div>

      <div className="flex gap-2">
        <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="max-w-xs">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {showForm && (
        <Card>
          <h3 className="font-medium mb-3">{editing ? "Edit expense" : "Add expense"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Amount *" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="250" />
            <Select label="Category *" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Store / person" />
            <Input label="Payment method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} placeholder="UPI / Card / Cash" />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Lunch, groceries…" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={submit}>{editing ? "Update" : "Add"}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card><p className="text-sm text-[var(--text-tertiary)]">No expenses yet — add your first one to see it here.</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const cat = categories.find((c) => c.id === e.categoryId);
            return (
              <Card key={e.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: cat?.color ?? "#ccc" }} />{e.description ?? e.merchant ?? "Expense"} <span className="text-xs text-[var(--text-tertiary)]">{cat?.name}</span></div>
                  <div className="text-xs text-[var(--text-tertiary)]">{e.date} {e.merchant && `· ${e.merchant}`}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums text-[var(--semantic-expense)]">₹{e.amount.toFixed(2)}</span>
                  <Button variant="secondary" size="sm" onClick={() => startEdit(e.id)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(e.id)}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)} title="Delete expense?" description="This will permanently delete the expense. This action cannot be undone." confirmLabel="Delete" onConfirm={() => { if (deleteId) { ExpenseService.delete(deleteId, { confirmed: true }); toast("Deleted", "success"); setDeleteId(null); refresh(); } }} />
    </div>
  );
}
