"use client";
import React, { useEffect, useState } from "react";
import { FamilyService } from "@/lib/services/family.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

function SkeletonCard() {
  return <div className="skeleton h-24 w-full" style={{ borderRadius: "var(--radius-md)" }} />;
}
function EmptyState({ onCta }: { onCta: () => void }) {
  return (
    <div className="border bg-[var(--color-surface)] text-center flex flex-col items-center" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)", padding: "var(--space-10) var(--space-6)" }}>
      <div className="h-12 w-12 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-muted)]"><Icon name="users" size={36} /></div>
      <h4 className="font-semibold mt-4" style={{ fontSize: "var(--font-size-h4)" }}>No family members yet</h4>
      <p className="mt-1 max-w-sm" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Add Dad, Mom, sibling or anyone you track locally. Members are color-tagged consistently across expenses and gifts.</p>
      <Button onClick={onCta} className="mt-4" style={{ minHeight: 44 }}><Icon name="add" size={16} /> Add a member</Button>
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

export default function FamilyPage() {
  const { toast } = useToast();
  const [family, setFamily] = useState(() => FamilyService.getAll());
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", birthday: "", color: "#3D63DE" });
  const [del, setDel] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const h = () => { try { setFamily(FamilyService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("storage", h); };
  }, []);

  const refresh = () => { try { setFamily(FamilyService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
  const submit = () => {
    if (!form.name.trim()) { setFormError("Name required."); return; }
    if (form.name.trim().length < 2) { setFormError("Name must be at least 2 characters."); return; }
    setFormError(null);
    try {
      FamilyService.create({ name: form.name.trim(), relationship: form.relationship || null, color: form.color, notes: null, birthday: form.birthday || null });
      toast("Added", "success"); setShow(false); setForm({ name: "", relationship: "", birthday: "", color: "#3D63DE" }); refresh(); window.dispatchEvent(new Event("calexpenses:refresh"));
    } catch (e) { setFormError((e as Error).message); toast((e as Error).message, "error"); }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-full" style={{ borderRadius: "var(--radius-md)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shared on this device strip §30 — calm Label/Caption, device icon, not synced/live */}
      <div
        className="flex items-center gap-2 border px-3 py-2.5"
        style={{ borderRadius: "var(--radius-md)", background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)" }}
        role="note"
        aria-label="Shared on this device"
      >
        <span className="h-7 w-7 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-secondary)] shrink-0" aria-hidden><Icon name="users" size={14} /></span>
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.03em" }}>Shared on this device</div>
          <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>Local &amp; private — stored only on this device. Share via exported PDF/CSV/JSON in Settings.</div>
        </div>
        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border" style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", borderRadius: "var(--radius-full)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-text-muted)" }} aria-hidden /> Local only
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}>Family</h1>
          <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Household profiles tracked locally — color-tagged consistently across transactions and events.</p>
        </div>
        <Button onClick={() => setShow(true)} aria-label="Add family member" style={{ minHeight: 44, borderRadius: "var(--radius-sm)" }}><Icon name="add" size={16} /> Add Member</Button>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 border p-3" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium">We couldn&apos;t load family: {loadError}</span><Button variant="secondary" size="sm" onClick={refresh}>Retry</Button>
        </div>
      )}

      <BottomSheet open={show} onClose={() => { setShow(false); setFormError(null); }} title="Add family member">
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dad" aria-required="true" />
          <Input label="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Mom, Dad, Sibling, Child" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Birthday" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Color tag</label>
              <div className="flex items-center gap-3 h-11 px-2 border bg-[var(--color-surface)]" style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--color-border)" }}>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-8 w-12 p-0 border-0 bg-transparent cursor-pointer" aria-label="Member color" style={{ minHeight: 32, minWidth: 48 }} />
                <span className="text-xs tabular-nums" style={{ color: "var(--color-text-secondary)" }}>{form.color}</span>
                <span className="ml-auto h-6 w-6 rounded-full border" style={{ background: form.color, borderColor: "var(--color-border)" }} aria-hidden />
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Used consistently on their transactions.</p>
            </div>
          </div>
          {formError && <p role="alert" className="text-sm" style={{ color: "var(--color-error)" }}>{formError}</p>}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-[var(--color-surface)] -mx-4 -mb-4 p-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShow(false)} className="flex-1" style={{ minHeight: 48 }}>Cancel</Button>
            <Button onClick={submit} className="flex-1" style={{ minHeight: 48 }}>Add</Button>
          </div>
        </div>
      </BottomSheet>

      {family.length === 0 ? <EmptyState onCta={() => setShow(true)} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {family.map((f) => (
            <Card key={f.id} className="flex flex-col gap-3" style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0 border" style={{ background: f.color, borderColor: "var(--color-border)", borderRadius: "var(--radius-full)" }} aria-hidden>
                  {f.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate" style={{ fontSize: "var(--font-size-body)", color: "var(--color-text-primary)" }}>{f.name}</div>
                  <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: f.color }} aria-hidden />{f.relationship || "No relationship"}</span>
                    {f.birthday && <span className="inline-flex items-center gap-1">· <Icon name="calendar" size={10} /> {f.birthday}</span>}
                  </div>
                </div>
                <span className="h-6 w-6 rounded-full border shrink-0" style={{ background: `${f.color}18`, borderColor: f.color, opacity: 0.9 }} aria-hidden title={`Color tag ${f.color}`} />
              </div>
              <div className="flex gap-2 mt-1">
                <Button variant="ghost" size="sm" onClick={() => setDel(f.id)} style={{ minHeight: 44, color: "var(--color-error)" }} aria-label={`Delete ${f.name}`}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>No presence indicators, no “last seen” — family data is local, not live-synced.</p>

      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete member?" description="Remove this local family profile. Transactions tagged to this member will keep their history but lose the tag." confirmLabel="Delete" onConfirm={() => { if (del) { FamilyService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); window.dispatchEvent(new Event("calexpenses:refresh")); } }} />
    </div>
  );
}
