"use client";
import React, { useState } from "react";
import { RecurringService } from "@/lib/services/recurring.service";
import { CategoryService } from "@/lib/services/category.service";
import { ExpenseService } from "@/lib/services/expense.service";
import { IncomeService } from "@/lib/services/income.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function RecurringPage() {
  const { toast } = useToast();
  const [list, setList] = useState(() => RecurringService.getAll());
  const [cats] = useState(() => CategoryService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ type: "expense" as const, amount: "", categoryId: "", startDate: new Date().toISOString().slice(0, 10), frequency: "monthly" as const, endDate: "" });
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setList(RecurringService.getAll());
  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast("Amount >0", "error"); return; }
    if (!form.categoryId) { toast("Category required", "error"); return; }
    try {
      RecurringService.create({ type: form.type, amount, categoryId: form.categoryId, startDate: form.startDate, frequency: form.frequency, customIntervalDays: null, endDate: form.endDate || null, occurrenceCount: null, status: "active", autoCreate: false, reminderDaysBefore: 3 });
      toast("Recurring created — will show as 'Bill' indicator", "success"); setShow(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };
  const generateNow = (id: string) => {
    const r = RecurringService.getById(id);
    if (!r) return;
    const cat = cats.find((c) => c.id === r.categoryId);
    if (r.type === "expense") ExpenseService.create({ amount: r.amount, currency: "INR", categoryId: r.categoryId, subcategory: null, date: new Date().toISOString().slice(0, 10), time: null, merchant: `Recurring: ${cat?.name ?? ""}`, description: `Recurring ${r.frequency}`, paymentMethod: null, tags: [], notes: null, recurringSourceId: r.id, eventId: null, giftId: null, createdVia: "recurring" });
    else IncomeService.create({ amount: r.amount, currency: "INR", sourceCategoryId: r.categoryId, date: new Date().toISOString().slice(0, 10), description: `Recurring ${r.frequency}`, notes: null, recurringSourceId: r.id, refundOfExpenseId: null, createdVia: "recurring" });
    RecurringService.markGenerated(id, new Date().toISOString().slice(0, 10));
    toast("Generated transaction", "success"); refresh(); window.dispatchEvent(new Event("calexpenses:refresh"));
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Recurring Bills</h1><Button onClick={() => setShow(true)}>+ Add Recurring</Button></div>
      <Card className="text-sm text-[var(--text-secondary)]"><strong>Note:</strong> Recurring does not silently create duplicates. Default <code>autoCreate=false</code> — you get a reminder and confirm. Enable autoCreate per item if desired.</Card>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">New recurring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}><option value="expense">Expense</option><option value="income">Income</option></Select>
            <Input label="Amount *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Category *" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select</option>{cats.filter((c) => form.type === "expense" ? c.type !== "income" : c.type !== "expense").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Custom</option></Select>
            <Input label="Start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End (optional)" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Create</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {list.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No recurring transactions yet.</p></Card> : (
        <div className="space-y-2">
          {list.map((r) => {
            const cat = cats.find((c) => c.id === r.categoryId);
            return <Card key={r.id} className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm"><div className="font-medium">{r.type} · {cat?.name} · ₹{r.amount} · {r.frequency} {r.status !== "active" && <span className="text-[var(--semantic-warning)]">({r.status})</span>}</div><div className="text-xs text-[var(--text-tertiary)]">Next: {r.nextOccurrenceDate ?? r.startDate} {r.endDate && `· until ${r.endDate}`}</div></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => generateNow(r.id)}>Generate now</Button><Button size="sm" variant="secondary" onClick={() => { RecurringService.togglePause(r.id); refresh(); }}>{r.status === "active" ? "Pause" : "Resume"}</Button><Button size="sm" variant="destructive" onClick={() => setDel(r.id)}>Delete</Button></div></Card>;
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete recurring?" description="Delete this recurring schedule permanently." confirmLabel="Delete" onConfirm={() => { if (del) { RecurringService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
