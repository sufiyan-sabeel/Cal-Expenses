"use client";
import React, { useEffect, useState } from "react";
import { GiftService } from "@/lib/services/gift.service";
import { EventService } from "@/lib/services/event.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

function SkeletonCard() {
  return <div className="skeleton h-36 w-full" style={{ borderRadius: "var(--radius-md)" }} />;
}
function EmptyState({ onCta }: { onCta: () => void }) {
  return (
    <div className="border bg-[var(--color-surface)] text-center flex flex-col items-center" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)", padding: "var(--space-10) var(--space-6)" }}>
      <div className="h-12 w-12 rounded-full bg-[var(--color-gift-bg)] grid place-items-center text-[var(--color-gift)]"><Icon name="gift" size={36} /></div>
      <h4 className="font-semibold mt-4" style={{ fontSize: "var(--font-size-h4)" }}>No gifts planned</h4>
      <p className="mt-1 max-w-sm" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>No gifts planned — add one to keep occasions on budget. Track recipient, budget and purchase status.</p>
      <Button onClick={onCta} className="mt-4" style={{ minHeight: 44 }}><Icon name="add" size={16} /> Plan Gift</Button>
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
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 grid place-items-center rounded-full hover:bg-[var(--color-surface-hover)]" style={{ minHeight: 44, minWidth: 44 }}><span className="rotate-45 text-xl leading-none">+</span></button>
        </div>
        <div className="p-4" style={{ padding: "var(--space-4)", paddingBottom: "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
      </div>
    </div>
  );
}

export default function GiftsPage() {
  const { toast } = useToast();
  const [gifts, setGifts] = useState(() => GiftService.getAll());
  const [events] = useState(() => EventService.getAll());
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ recipient: "", occasion: "", date: new Date().toISOString().slice(0, 10), budget: "", plannedGift: "", eventId: "" });
  const [del, setDel] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"" | "planned" | "purchased">("");

  useEffect(() => {
    setMounted(true);
    const h = () => { try { setGifts(GiftService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("storage", h);
    if (new URLSearchParams(window.location.search).get("action") === "new") setShow(true);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("storage", h); };
  }, []);

  const refresh = () => { try { setGifts(GiftService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
  const submit = () => {
    const b = parseFloat(form.budget);
    if (!form.recipient.trim()) { setFormError("Recipient required."); return; }
    if (!b || b <= 0) { setFormError("Enter a budget greater than ₹0."); return; }
    setFormError(null);
    try {
      GiftService.create({ recipient: form.recipient.trim(), familyMemberId: null, occasion: form.occasion || "General", date: form.date, budget: b, plannedGift: form.plannedGift || null, purchasedStatus: "planned", actualCost: null, notes: null, reminderDaysBefore: 3, eventId: form.eventId || null, linkedExpenseId: null });
      toast("Gift planned", "success"); setShow(false); refresh(); window.dispatchEvent(new Event("calexpenses:refresh"));
    } catch (e) { setFormError((e as Error).message); toast((e as Error).message, "error"); }
  };

  const filtered = filter ? gifts.filter((g) => g.purchasedStatus === filter) : gifts;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="skeleton h-7 w-28" /><div className="skeleton h-11 w-28" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}>Gift Planner</h1>
          <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Recipients, occasions and budgets — stay thoughtful and on budget.</p>
        </div>
        <Button onClick={() => setShow(true)} aria-label="Plan new gift" style={{ minHeight: 44, borderRadius: "var(--radius-sm)" }}><Icon name="add" size={16} /> Plan Gift</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Gift filters">
        {[
          { id: "", label: "All" },
          { id: "planned", label: "Planned" },
          { id: "purchased", label: "Purchased" },
        ].map((t) => (
          <button
            key={t.id || "all"}
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id as "" | "planned" | "purchased")}
            className={`shrink-0 px-3 py-2 text-sm font-medium border ${filter === t.id ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"}`}
            style={{ borderRadius: "var(--radius-full)", minHeight: 44 }}
          >{t.label}</button>
        ))}
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 border p-3" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium">We couldn&apos;t load gifts: {loadError}</span><Button variant="secondary" size="sm" onClick={refresh}>Retry</Button>
        </div>
      )}

      <BottomSheet open={show} onClose={() => { setShow(false); setFormError(null); }} title="Plan gift">
        <div className="space-y-4">
          <Input label="Recipient *" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Mom" aria-required="true" />
          <Input label="Occasion" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="Birthday" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-required="true" />
            <Input label="Budget *" type="number" inputMode="decimal" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="1500" aria-required="true" />
          </div>
          <Input label="Planned gift" value={form.plannedGift} onChange={(e) => setForm({ ...form, plannedGift: e.target.value })} placeholder="Watch" />
          <Select label="Linked event" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
            <option value="">None</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </Select>
          {formError && <p role="alert" className="text-sm" style={{ color: "var(--color-error)" }}>{formError}</p>}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-[var(--color-surface)] -mx-4 -mb-4 p-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShow(false)} className="flex-1" style={{ minHeight: 48 }}>Cancel</Button>
            <Button onClick={submit} className="flex-1" style={{ minHeight: 48 }}>Save</Button>
          </div>
        </div>
      </BottomSheet>

      {filtered.length === 0 ? (
        gifts.length === 0 ? <EmptyState onCta={() => setShow(true)} /> : (
          <div className="border bg-[var(--color-surface)] text-center py-8 px-4" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)" }}>
            <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-muted)]"><Icon name="gift" size={18} /></div>
            <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>No {filter} gifts.</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((g) => {
            const isPurchased = g.purchasedStatus === "purchased";
            return (
              <Card key={g.id} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold truncate" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>For {g.recipient}</h4>
                  {/* Badge — neutral per §29, not stoplight */}
                  <span
                    className="shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-medium capitalize"
                    style={{
                      borderRadius: "var(--radius-full)",
                      background: isPurchased ? "var(--color-surface-hover)" : "var(--color-gift-bg)",
                      color: isPurchased ? "var(--color-text-secondary)" : "var(--color-gift)",
                      border: `1px solid ${isPurchased ? "var(--color-border)" : "var(--color-gift)"}30`,
                    }}
                  >{g.purchasedStatus}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 flex-wrap" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
                  <span className="inline-flex items-center gap-1"><Icon name="calendar" size={12} /> {g.date}</span>
                  <span>·</span><span>{g.occasion}</span>
                  {g.plannedGift && <><span>·</span><span className="truncate">{g.plannedGift}</span></>}
                  {g.eventId && <><span>·</span><span className="truncate">linked event</span></>}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-[var(--color-surface-hover)] p-2 text-center" style={{ borderRadius: "var(--radius-sm)" }}>
                    <div className="text-[10px] tracking-wide font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>Budget</div>
                    <div className="font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-sm)", color: "var(--color-text-primary)" }}>₹{g.budget.toFixed(0)}</div>
                  </div>
                  <div className="rounded-md p-2 text-center" style={{ borderRadius: "var(--radius-sm)", background: isPurchased ? "var(--color-income-bg)" : "var(--color-surface-hover)", border: isPurchased ? "1px solid var(--color-income)18" : "none" }}>
                    <div className="text-[10px] tracking-wide font-semibold uppercase" style={{ color: isPurchased ? "var(--color-income)" : "var(--color-text-muted)" }}>{isPurchased ? "Paid" : "Actual"}</div>
                    <div className="font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-sm)", color: isPurchased ? "var(--color-income)" : "var(--color-text-muted)" }}>{g.actualCost !== null ? `₹${g.actualCost.toFixed(0)}` : "—"}</div>
                  </div>
                </div>
                {g.actualCost !== null && g.actualCost > g.budget && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--color-error)" }}><Icon name="trendingUp" size={12} /> Over budget by ₹{(g.actualCost - g.budget).toFixed(0)}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {g.purchasedStatus === "planned" && (
                    <Button size="sm" variant="secondary" onClick={() => { const c = prompt("Actual cost?"); const v = c ? parseFloat(c) : NaN; if (Number.isFinite(v) && v > 0) { GiftService.markPurchased(g.id, v); toast("Marked purchased", "success"); refresh(); window.dispatchEvent(new Event("calexpenses:refresh")); } else if (c !== null) toast("Enter an amount greater than ₹0", "error"); }} style={{ minHeight: 44 }} aria-label={`Mark gift for ${g.recipient} as purchased`}>
                      Mark purchased
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setDel(g.id)} style={{ minHeight: 44, color: "var(--color-error)" }} aria-label={`Delete gift for ${g.recipient}`}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete gift?" description="Delete this gift plan permanently. This cannot be undone." confirmLabel="Delete" onConfirm={() => { if (del) { GiftService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); window.dispatchEvent(new Event("calexpenses:refresh")); } }} />
    </div>
  );
}
