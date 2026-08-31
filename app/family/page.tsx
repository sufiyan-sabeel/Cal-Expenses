"use client";
import React, { useState } from "react";
import { FamilyService } from "@/lib/services/family.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function FamilyPage() {
  const { toast } = useToast();
  const [family, setFamily] = useState(() => FamilyService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", birthday: "", color: "#5B8DEF" });
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setFamily(FamilyService.getAll());
  const submit = () => {
    if (!form.name) { toast("Name required", "error"); return; }
    try { FamilyService.create({ name: form.name, relationship: form.relationship || null, color: form.color, notes: null, birthday: form.birthday || null }); toast("Added", "success"); setShow(false); setForm({ name: "", relationship: "", birthday: "", color: "#5B8DEF" }); refresh(); } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-4">
      <div className="bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/20 rounded-md p-3 text-sm">
        <strong>Local-only:</strong> Family data is stored only on this device and used for planning/tagging. Sharing is via exported PDF/CSV/JSON — not live sync (V2).
      </div>
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Family</h1><Button onClick={() => setShow(true)}>+ Add Member</Button></div>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">Add family member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Mom, Dad, Sibling" />
            <Input label="Birthday" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            <Input label="Color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Add</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {family.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No family members yet — add Dad, Mom, etc. to tag events/gifts.</p></Card> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {family.map((f) => (
            <Card key={f.id}>
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ background: f.color }}>{f.name[0]}</div><div><div className="font-medium text-sm">{f.name}</div><div className="text-xs text-[var(--text-tertiary)]">{f.relationship ?? "—"} {f.birthday && `· 🎂 ${f.birthday}`}</div></div></div>
              <Button variant="destructive" size="sm" className="mt-3" onClick={() => setDel(f.id)}>Delete</Button>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete member?" description="Remove this local family profile." confirmLabel="Delete" onConfirm={() => { if (del) { FamilyService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
