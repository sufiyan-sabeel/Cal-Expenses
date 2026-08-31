"use client";
import React, { useState } from "react";
import { GoalService } from "@/lib/services/goal.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function GoalsPage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState(() => GoalService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", targetAmount: "", deadline: "" });
  const [contrib, setContrib] = useState<{ id: string; amount: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setGoals(GoalService.getAll());
  const submit = () => {
    const amt = parseFloat(form.targetAmount);
    if (!form.title || form.title.length < 2) { toast("Title required", "error"); return; }
    if (!amt || amt <= 0) { toast("Target >0", "error"); return; }
    try { GoalService.create({ title: form.title, targetAmount: amt, deadline: form.deadline || null }); toast("Goal created", "success"); setShow(false); setForm({ title: "", targetAmount: "", deadline: "" }); refresh(); } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Goals</h1><Button onClick={() => setShow(true)}>+ New Goal</Button></div>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">Create savings goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New Laptop" />
            <Input label="Target amount *" type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Create</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {goals.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No goals yet — set a savings target to track progress.</p></Card> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((g) => {
            const current = GoalService.currentAmount(g.id);
            const pct = g.targetAmount ? Math.min((current / g.targetAmount) * 100, 100) : 0;
            const isOverdue = g.deadline && g.deadline < new Date().toISOString().slice(0, 10) && current < g.targetAmount;
            return (
              <Card key={g.id}>
                <div className="flex justify-between"><h4 className="font-medium">{g.title}</h4><span className={`text-xs px-2 py-1 rounded-full ${g.status === "achieved" ? "bg-[var(--semantic-income)]/15 text-[var(--semantic-income)]" : isOverdue ? "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)]" : "bg-[var(--surface-elevated-2)]"}`}>{isOverdue ? "Overdue" : g.status}</span></div>
                <div className="text-xs text-[var(--text-tertiary)]">Target ₹{g.targetAmount} {g.deadline && `· due ${g.deadline}`}</div>
                <div className="h-2 bg-[var(--surface-elevated-2)] rounded-full mt-3 overflow-hidden"><div className="h-full bg-[var(--semantic-income)] transition-all" style={{ width: `${pct}%` }} /></div>
                <div className="text-sm mt-1">Progress {pct.toFixed(0)}% — ₹{current.toFixed(0)} / ₹{g.targetAmount.toFixed(0)}</div>
                <div className="flex gap-2 mt-3">
                  {contrib?.id === g.id ? (
                    <><Input type="number" placeholder="Amount" value={contrib.amount} onChange={(e) => setContrib({ id: g.id, amount: e.target.value })} className="max-w-[140px]" /><Button size="sm" onClick={() => { const a = parseFloat(contrib.amount); if (a > 0) { GoalService.addContribution(g.id, a, new Date().toISOString().slice(0, 10)); toast("Contribution added", "success"); setContrib(null); refresh(); } }}>Add</Button><Button variant="ghost" size="sm" onClick={() => setContrib(null)}>Cancel</Button></>
                  ) : <Button size="sm" variant="secondary" onClick={() => setContrib({ id: g.id, amount: "" })}>+ Contribute</Button>}
                  <Button variant="destructive" size="sm" onClick={() => setDel(g.id)}>Delete</Button>
                </div>
                {GoalService.getContributionsForGoal(g.id).length > 0 && (
                  <details className="mt-3"><summary className="text-xs text-[var(--accent-primary)] cursor-pointer">History ({GoalService.getContributionsForGoal(g.id).length})</summary>
                    <ul className="text-xs mt-1 space-y-1">{GoalService.getContributionsForGoal(g.id).map((c) => <li key={c.id} className="flex justify-between"><span>{c.date}</span><span>₹{c.amount}</span></li>)}</ul>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete goal?" description="Delete goal and its contributions permanently." confirmLabel="Delete" onConfirm={() => { if (del) { GoalService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
