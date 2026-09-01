"use client";
import React, { useEffect, useState } from "react";
import { EventService } from "@/lib/services/event.service";
import { ExpenseService } from "@/lib/services/expense.service";
import { GiftService } from "@/lib/services/gift.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

function SkeletonCard() {
  return <div className="skeleton h-36 w-full" style={{ borderRadius: "var(--radius-md)", background: "var(--color-surface-hover)" }} />;
}
function EmptyState({ onCta }: { onCta: () => void }) {
  return (
    <div className="border bg-[var(--color-surface)] text-center flex flex-col items-center" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)", padding: "var(--space-10) var(--space-6)" }}>
      <div className="h-12 w-12 rounded-full bg-[var(--color-event-bg)] grid place-items-center text-[var(--color-event)]"><Icon name="calendar" size={36} /></div>
      <h4 className="font-semibold mt-4" style={{ fontSize: "var(--font-size-h4)" }}>No events planned</h4>
      <p className="mt-1 max-w-sm" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Nothing on the calendar this month yet. Plan a birthday, trip or occasion to budget for it.</p>
      <Button onClick={onCta} className="mt-4" style={{ minHeight: 44 }}><Icon name="add" size={16} /> Add Event</Button>
    </div>
  );
}
function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[var(--surface-overlay)]" onClick={onClose} aria-hidden />
      <div className="relative w-full lg:max-w-lg bg-[var(--color-surface)] border-t lg:border border-[var(--color-border)] max-h-[92vh] overflow-auto" style={{ borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)", boxShadow: "var(--elevation-3)" }}>
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold" style={{ fontSize: "var(--font-size-h3)" }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 grid place-items-center rounded-full hover:bg-[var(--color-surface-hover)]" style={{ minHeight: 44, minWidth: 44 }}><span className="text-xl leading-none rotate-45 inline-block">+</span></button>
        </div>
        <div className="p-4" style={{ padding: "var(--space-4)", paddingBottom: "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState(() => EventService.getAll());
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", templateType: "other" as const, startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), budget: "", location: "" });
  const [del, setDel] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const h = () => { try { setEvents(EventService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("storage", h);
    if (new URLSearchParams(window.location.search).get("action") === "new") setShow(true);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("storage", h); };
  }, []);

  const refresh = () => { try { setEvents(EventService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
  const submit = () => {
    if (!form.title || form.title.trim().length < 2) { setFormError("Title required — at least 2 characters."); return; }
    if (form.startDate && form.endDate && form.endDate < form.startDate) { setFormError("End date cannot be before start date."); return; }
    setFormError(null);
    try {
      EventService.create({ title: form.title.trim(), templateType: form.templateType as unknown as string, startDate: form.startDate, endDate: form.endDate, time: null, location: form.location || null, notes: null, familyMemberIds: [], freeTextPeople: [], budget: form.budget ? parseFloat(form.budget) : null, plannedExpenses: [], reminderDaysBefore: 3 } as Parameters<typeof EventService.create>[0]);
      toast("Event created", "success"); setShow(false); refresh(); window.dispatchEvent(new Event("calexpenses:refresh"));
    } catch (e) { setFormError((e as Error).message); toast((e as Error).message, "error"); }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="skeleton h-7 w-20" style={{ borderRadius: "var(--radius-xs)" }} /><div className="skeleton h-11 w-28" style={{ borderRadius: "var(--radius-sm)" }} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}>Events</h1>
          <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Occasions with budgets and linked expenses — keep celebrations on budget.</p>
        </div>
        <Button onClick={() => setShow(true)} aria-label="Create new event" style={{ minHeight: 44, borderRadius: "var(--radius-sm)" }}><Icon name="add" size={16} /> New Event</Button>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 border p-3" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium">We couldn&apos;t load events: {loadError}</span><Button variant="secondary" size="sm" onClick={refresh}>Retry</Button>
        </div>
      )}

      <BottomSheet open={show} onClose={() => { setShow(false); setFormError(null); }} title="Create event">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mom's Birthday" aria-required="true" />
          <Select label="Type" value={form.templateType} onChange={(e) => setForm({ ...form, templateType: e.target.value as unknown as typeof form.templateType })}>
            <option value="birthday">Birthday</option><option value="trip">Trip</option><option value="wedding">Wedding</option><option value="festival">Festival</option><option value="school">School</option><option value="family">Family</option><option value="shopping">Shopping</option><option value="other">Other</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Input label="Budget (optional)" type="number" inputMode="decimal" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="3000" />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Home, venue, city" />
          {formError && <p role="alert" className="text-sm" style={{ color: "var(--color-error)" }}>{formError}</p>}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-[var(--color-surface)] -mx-4 -mb-4 p-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShow(false)} className="flex-1" style={{ minHeight: 48 }}>Cancel</Button>
            <Button onClick={submit} className="flex-1" style={{ minHeight: 48 }}>Create</Button>
          </div>
        </div>
      </BottomSheet>

      {events.length === 0 ? <EmptyState onCta={() => setShow(true)} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {events.map((e) => {
            const actual = ExpenseService.getAll().filter((ex) => ex.eventId === e.id).reduce((s, ex) => s + ex.amount, 0) + GiftService.getAll().filter((g) => g.eventId === e.id && g.actualCost).reduce((s, g) => s + (g.actualCost ?? 0), 0);
            const remaining = e.budget !== null ? e.budget - actual : null;
            const over = remaining !== null && remaining < 0;
            return (
              <Card key={e.id} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold truncate" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>{e.title}</h4>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-medium capitalize" style={{ borderRadius: "var(--radius-full)", background: "var(--color-event-bg)", color: "var(--color-event)", border: "1px solid var(--color-event)", opacity: 0.9 }}>{e.templateType}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}><Icon name="calendar" size={12} /> {e.startDate} → {e.endDate} {e.location && `· ${e.location}`}</p>

                {/* Budget trio §28 */}
                {e.budget !== null ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-[var(--color-surface-hover)] p-2 text-center" style={{ borderRadius: "var(--radius-sm)" }}>
                      <div className="text-[10px] tracking-wide font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>Budget</div>
                      <div className="font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-sm)", color: "var(--color-text-primary)" }}>₹{e.budget.toFixed(0)}</div>
                    </div>
                    <div className="rounded-md bg-[var(--color-surface-hover)] p-2 text-center" style={{ borderRadius: "var(--radius-sm)" }}>
                      <div className="text-[10px] tracking-wide font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>Spent</div>
                      <div className="font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-sm)", color: "var(--color-expense)" }}>₹{actual.toFixed(0)}</div>
                    </div>
                    <div className="rounded-md p-2 text-center" style={{ borderRadius: "var(--radius-sm)", background: over ? "var(--color-error-bg)" : "var(--color-income-bg)", border: `1px solid ${over ? "var(--color-error)" : "var(--color-income)"}18` }}>
                      <div className="text-[10px] tracking-wide font-semibold uppercase" style={{ color: over ? "var(--color-error)" : "var(--color-income)" }}>{over ? "Over" : "Left"}</div>
                      <div className="font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-sm)", color: over ? "var(--color-error)" : "var(--color-income)" }}>{remaining !== null ? (over ? `−₹${Math.abs(remaining).toFixed(0)}` : `₹${remaining.toFixed(0)}`) : "—"}</div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Spent <span className="font-semibold tabular-nums" style={{ color: "var(--color-expense)" }}>₹{actual.toFixed(0)}</span> <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>(no budget set)</span></p>
                )}

                {/* Linked item icon row + progress if budgeted */}
                {e.budget !== null && e.budget > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)" }}>
                      <div className="h-full" style={{ width: `${Math.min((actual / e.budget) * 100, 100)}%`, background: over ? "var(--color-error)" : "var(--color-event)", borderRadius: "var(--radius-full)", transition: "width var(--motion-duration-base) var(--motion-easing-standard)" }} />
                    </div>
                    <div className="flex justify-between mt-1" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
                      <span className="tabular-nums">{e.budget ? ((actual / e.budget) * 100).toFixed(0) : "0"}% used</span>
                      <span>{over ? "Over budget" : "On track"}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="inline-flex items-center gap-1"><Icon name="gift" size={12} /> gifts</span>
                  <span className="inline-flex items-center gap-1"><Icon name="receipt" size={12} /> expenses</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => setDel(e.id)} style={{ minHeight: 44, color: "var(--color-error)" }} aria-label={`Delete ${e.title}`}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete event?" description="Linked expenses/gifts will be unlinked (not deleted) by default." confirmLabel="Delete" onConfirm={() => { if (del) { EventService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); window.dispatchEvent(new Event("calexpenses:refresh")); } }} />
    </div>
  );
}
