"use client";
import React, { useState } from "react";
import { AutomationService } from "@/lib/services/automation.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function AutomationsPage() {
  const { toast } = useToast();
  const [autos, setAutos] = useState(() => AutomationService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "expense_created" as const, action: "notify" as const, threshold: "500" });
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setAutos(AutomationService.getAll());
  const submit = () => {
    if (!form.name) { toast("Name required", "error"); return; }
    try {
      AutomationService.create({ name: form.name, enabled: true, trigger: { type: form.trigger, params: { threshold: parseFloat(form.threshold) || 500 } }, conditions: [], action: { type: form.action, params: { message: form.name } } });
      toast("Automation created — inspectable, editable, disable-able", "success"); setShow(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Automations</h1><Button onClick={() => setShow(true)}>+ New Automation</Button></div>
      <Card className="text-sm text-[var(--text-secondary)]">Automations are explicit rules: <code>Trigger → Condition → Action</code>. Actions: notify, generate_insight, create_reminder. Never executes arbitrary code. Runs client-side on app load and on data changes.</Card>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">New automation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Expense > ₹500 → notify" />
            <Select label="Trigger" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as any })}>
              <option value="expense_created">expense_created</option><option value="budget_utilization">budget_utilization</option><option value="due_within_days">due_within_days</option><option value="goal_progress">goal_progress</option>
            </Select>
            <Select label="Action" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as any })}>
              <option value="notify">notify</option><option value="generate_insight">generate_insight</option><option value="create_reminder">create_reminder</option>
            </Select>
            <Input label="Threshold / param" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Create</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {autos.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No automations yet.</p></Card> : (
        <div className="space-y-2">
          {autos.map((a) => (
            <Card key={a.id} className="flex flex-wrap justify-between gap-2">
              <div className="text-sm"><div className="font-medium flex gap-2 items-center">{a.name} <span className={`text-xs px-2 py-0.5 rounded-full ${a.enabled ? "bg-[var(--semantic-income)]/15 text-[var(--semantic-income)]" : "bg-[var(--surface-elevated-2)]"}`}>{a.enabled ? "enabled" : "disabled"}</span></div><div className="text-xs text-[var(--text-tertiary)]">{a.trigger.type} → {a.action.type} {a.lastRunAt && `· last ${a.lastRunAt.slice(0, 10)} ${a.lastRunStatus}`}</div></div>
              <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => { AutomationService.toggle(a.id); refresh(); }}>{a.enabled ? "Disable" : "Enable"}</Button><Button size="sm" variant="destructive" onClick={() => setDel(a.id)}>Delete</Button></div>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete automation?" description="Delete this automation permanently." confirmLabel="Delete" onConfirm={() => { if (del) { AutomationService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
