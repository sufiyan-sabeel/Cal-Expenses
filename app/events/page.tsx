"use client";
import React, { useState } from "react";
import { EventService } from "@/lib/services/event.service";
import { ExpenseService } from "@/lib/services/expense.service";
import { GiftService } from "@/lib/services/gift.service";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState(() => EventService.getAll());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", templateType: "other" as const, startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), budget: "", location: "" });
  const [del, setDel] = useState<string | null>(null);
  const refresh = () => setEvents(EventService.getAll());
  const submit = () => {
    if (!form.title || form.title.length < 2) { toast("Title required", "error"); return; }
    try {
      EventService.create({ title: form.title, templateType: form.templateType as any, startDate: form.startDate, endDate: form.endDate, time: null, location: form.location || null, notes: null, familyMemberIds: [], freeTextPeople: [], budget: form.budget ? parseFloat(form.budget) : null, plannedExpenses: [], reminderDaysBefore: 3 });
      toast("Event created", "success"); setShow(false); refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Events</h1><Button onClick={() => setShow(true)}>+ New Event</Button></div>
      {show && (
        <Card>
          <h3 className="font-medium mb-3">Create event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mom's Birthday" />
            <Select label="Type" value={form.templateType} onChange={(e) => setForm({ ...form, templateType: e.target.value as any })}>
              <option value="birthday">Birthday</option><option value="trip">Trip</option><option value="wedding">Wedding</option><option value="festival">Festival</option><option value="school">School</option><option value="family">Family</option><option value="shopping">Shopping</option><option value="other">Other</option>
            </Select>
            <Input label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Input label="Budget (optional)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="3000" />
            <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={submit}>Create</Button><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
        </Card>
      )}
      {events.length === 0 ? <Card><p className="text-sm text-[var(--text-tertiary)]">No events yet — plan your first birthday, trip, or occasion.</p></Card> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {events.map((e) => {
            const actual = ExpenseService.getAll().filter((ex) => ex.eventId === e.id).reduce((s, ex) => s + ex.amount, 0) + GiftService.getAll().filter((g) => g.eventId === e.id && g.actualCost).reduce((s, g) => s + (g.actualCost ?? 0), 0);
            const remaining = e.budget !== null ? e.budget - actual : null;
            return (
              <Card key={e.id}>
                <div className="flex justify-between"><h4 className="font-medium">{e.title}</h4><span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-primary-subtle)] capitalize">{e.templateType}</span></div>
                <p className="text-xs text-[var(--text-tertiary)]">{e.startDate} → {e.endDate} {e.location && `· ${e.location}`}</p>
                {e.budget !== null && <div className="text-sm mt-2">Budget ₹{e.budget} · Spent ₹{actual} {remaining !== null && <span className={remaining < 0 ? "text-[var(--semantic-danger)]" : "text-[var(--text-secondary)]"}>· {remaining >= 0 ? `₹${remaining.toFixed(0)} left` : `over by ₹${Math.abs(remaining).toFixed(0)}`}</span>}</div>}
                <div className="flex gap-2 mt-3"><Button variant="destructive" size="sm" onClick={() => setDel(e.id)}>Delete</Button></div>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete event?" description="Linked expenses/gifts will be unlinked (not deleted) by default." confirmLabel="Delete" onConfirm={() => { if (del) { EventService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); } }} />
    </div>
  );
}
