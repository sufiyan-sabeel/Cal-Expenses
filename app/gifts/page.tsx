"use client";
import React, { useState } from "react";
import { GiftService } from "@/lib/services/gift.service";
import { EventService } from "@/lib/services/event.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function GiftsPage() {
  const { toast } = useToast();
  const [gifts, setGifts] = useState(() => GiftService.getAll());
  const [events] = useState(() => EventService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ recipient: "", occasion: "", date: new Date().toISOString().slice(0, 10), budget: "", plannedGift: "", eventId: "" });
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setGifts(GiftService.getAll());
  const submit = () => {
    const b = parseFloat(form.budget);
    if (!form.recipient) { toast("Recipient required", "error"); return; }
    if (!b || b <= 0) { toast("Budget >0", "error"); return; }
    try {
      GiftService.create({ recipient: form.recipient, familyMemberId: null, occasion: form.occasion || "General", date: form.date, budget: b, plannedGift: form.plannedGift || null, purchasedStatus: "planned", actualCost: null, notes: null, reminderDaysBefore: 3, eventId: form.eventId || null, linkedExpenseId: null });
      toast("Gift planned", "success"); setShow(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Gift Planner</h1><Button onClick={() => setShow(true)}>+ Plan Gift</Button></div>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">Plan gift</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Recipient *" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Mom" />
            <Input label="Occasion" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="Birthday" />
            <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Budget *" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            <Input label="Planned gift" value={form.plannedGift} onChange={(e) => setForm({ ...form, plannedGift: e.target.value })} placeholder="Watch" />
            <Select label="Linked event" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
              <option value="">None</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </Select>
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Save</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {gifts.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No gifts planned yet.</p></Card> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gifts.map((g) => (
            <Card key={g.id}>
              <div className="flex justify-between"><h4 className="font-medium">For {g.recipient}</h4><span className={`text-xs px-2 py-1 rounded-full ${g.purchasedStatus === "purchased" ? "bg-[var(--semantic-income)]/15 text-[var(--semantic-income)]" : "bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]"}`}>{g.purchasedStatus}</span></div>
              <p className="text-xs text-[var(--text-tertiary)]">{g.occasion} · {g.date} {g.plannedGift && `· ${g.plannedGift}`}</p>
              <p className="text-sm mt-1">Budget ₹{g.budget} {g.actualCost !== null && `· Paid ₹${g.actualCost}`}</p>
              <div className="flex gap-2 mt-3">
                {g.purchasedStatus === "planned" && <Button size="sm" variant="secondary" onClick={() => { const c = prompt("Actual cost?"); const v = c ? parseFloat(c) : NaN; if (v > 0) { GiftService.markPurchased(g.id, v); toast("Marked purchased", "success"); refresh(); } }}>Mark purchased</Button>}
                <Button variant="destructive" size="sm" onClick={() => setDel(g.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete gift?" description="Delete this gift plan permanently." confirmLabel="Delete" onConfirm={() => { if (del) { GiftService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
