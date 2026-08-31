"use client";
import React, { useState, useEffect } from "react";
import { IncomeService } from "@/lib/services/income.service";
import { CategoryService } from "@/lib/services/category.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { todayISODate } from "@/lib/domain/common";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function IncomePage() {
  const { toast } = useToast();
  const [incomes, setIncomes] = useState(() => IncomeService.getAll());
  const [categories] = useState(() => CategoryService.getAll().filter((c) => c.type === "income" || c.type === "both"));
  const [showForm, setShowForm] = useState(false);
  useEffect(() => { if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "new") setShowForm(true); }, []);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", sourceCategoryId: "", date: todayISODate(), description: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const refresh = () => { setIncomes(IncomeService.getAll()); if (typeof window !== "undefined") window.dispatchEvent(new Event("calexpenses:refresh")); };

  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast("Amount must be >0", "error"); return; }
    if (!form.sourceCategoryId) { toast("Source required", "error"); return; }
    try {
      if (editing) {
        IncomeService.update(editing, { amount, sourceCategoryId: form.sourceCategoryId, date: form.date, description: form.description || null });
        toast("Income updated", "success");
      } else {
        IncomeService.create({ amount, currency: "INR", sourceCategoryId: form.sourceCategoryId, date: form.date, description: form.description || null, notes: null, recurringSourceId: null, refundOfExpenseId: null, createdVia: "manual" });
        toast("Income added", "success");
      }
      setShowForm(false); setEditing(null); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Income</h1>
        <Button onClick={() => { setEditing(null); setForm({ amount: "", sourceCategoryId: categories[0]?.id ?? "", date: todayISODate(), description: "" }); setShowForm(true); }}>+ New Income</Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="font-medium mb-3">{editing ? "Edit income" : "Add income"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Amount *" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Source *" value={form.sourceCategoryId} onChange={(e) => setForm({ ...form, sourceCategoryId: e.target.value })}>
              <option value="">Select</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Salary, freelance…" />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>{editing ? "Update" : "Add"}</Button><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </Card>
      )}

      {incomes.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No income yet — add your first income to see balance grow.</p></Card> : (
        <div className="space-y-2">
          {incomes.map((i) => {
            const cat = categories.find((c) => c.id === i.sourceCategoryId);
            return (
              <Card key={i.id} className="flex items-center justify-between">
                <div><div className="font-medium text-sm flex gap-2 items-center"><span className="h-2 w-2 rounded-full" style={{ background: cat?.color ?? "#1F9D6B" }} />{i.description ?? cat?.name ?? "Income"} <span className="text-xs text-[var(--text-tertiary)]">{i.date}</span></div><div className="text-xs text-[var(--text-tertiary)]">{cat?.name}</div></div>
                <div className="flex items-center gap-2"><span className="font-semibold tabular-nums text-[var(--semantic-income)]">₹{i.amount.toFixed(2)}</span><Button variant="secondary" size="sm" onClick={() => { setEditing(i.id); setForm({ amount: String(i.amount), sourceCategoryId: i.sourceCategoryId, date: i.date, description: i.description ?? "" }); setShowForm(true); }}>Edit</Button><Button variant="destructive" size="sm" onClick={() => setDeleteId(i.id)}>Delete</Button></div>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)} title="Delete income?" description="Permanently delete this income record." confirmLabel="Delete" onConfirm={() => { if (deleteId) { IncomeService.delete(deleteId, { confirmed: true }); toast("Deleted", "success"); setDeleteId(null); refresh(); } }} />
    </div>
  );
}
