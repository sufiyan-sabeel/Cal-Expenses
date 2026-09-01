"use client";
import React, { useEffect, useState } from "react";
import { GoalService } from "@/lib/services/goal.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

type GoalForm = { title: string; targetAmount: string; deadline: string };

function SkeletonCard() {
  return (
    <div className="border bg-[var(--color-surface)] p-4 flex flex-col gap-3" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)" }}>
      <div className="skeleton h-5 w-32" style={{ borderRadius: "var(--radius-xs)" }} />
      <div className="skeleton h-3 w-40" style={{ borderRadius: "var(--radius-xs)" }} />
      <div className="skeleton h-2 w-full" style={{ borderRadius: "var(--radius-full)" }} />
      <div className="skeleton h-3 w-24" style={{ borderRadius: "var(--radius-xs)" }} />
    </div>
  );
}

function EmptyState({ onCta }: { onCta: () => void }) {
  return (
    <div
      className="border bg-[var(--color-surface)] text-center flex flex-col items-center"
      style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)", padding: "var(--space-10) var(--space-6)" }}
    >
      <div className="h-12 w-12 rounded-full bg-[var(--color-goal-bg)] grid place-items-center text-[var(--color-goal)]" aria-hidden>
        <Icon name="target" size={36} />
      </div>
      <h4 className="font-semibold mt-4" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>
        No savings goals yet
      </h4>
      <p className="mt-1 max-w-sm" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
        No savings goals yet — what are you working toward? Set a target and track contributions toward it.
      </p>
      <Button onClick={onCta} className="mt-4" style={{ minHeight: 44 }}>
        <Icon name="add" size={16} /> Create Goal
      </Button>
    </div>
  );
}

function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        className="relative w-full lg:max-w-lg bg-[var(--color-surface)] border-t lg:border border-[var(--color-border)] max-h-[92vh] overflow-auto"
        style={{
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          boxShadow: "var(--elevation-3)",
          animation: "sheetIn var(--motion-duration-slow) var(--motion-easing-decelerate)",
        }}
      >
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between" style={{ paddingTop: "calc(var(--space-3) + env(safe-area-inset-top, 0px))" }}>
          <h2 className="font-semibold" style={{ fontSize: "var(--font-size-h3)" }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 grid place-items-center rounded-full hover:bg-[var(--color-surface-hover)]" style={{ minHeight: 44, minWidth: 44 }}>
            <Icon name="add" size={18} className="rotate-45" />
          </button>
        </div>
        <div className="p-4" style={{ padding: "var(--space-4)", paddingBottom: "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
      </div>
      <style>{`@keyframes sheetIn{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

export default function GoalsPage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState(() => GoalService.getAll());
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<GoalForm>({ title: "", targetAmount: "", deadline: "" });
  const [contrib, setContrib] = useState<{ id: string; amount: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const onRefresh = () => {
      try { setGoals(GoalService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); }
    };
    window.addEventListener("calexpenses:refresh", onRefresh as EventListener);
    window.addEventListener("storage", onRefresh);
    return () => { window.removeEventListener("calexpenses:refresh", onRefresh as EventListener); window.removeEventListener("storage", onRefresh); };
  }, []);

  const refresh = () => {
    try { setGoals(GoalService.getAll()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); }
  };

  const submit = () => {
    const amt = parseFloat(form.targetAmount);
    if (!form.title || form.title.trim().length < 2) { setFormError("Enter a title with at least 2 characters."); return; }
    if (!amt || amt <= 0) { setFormError("Enter an amount greater than ₹0."); return; }
    setFormError(null);
    try {
      GoalService.create({ title: form.title.trim(), targetAmount: amt, deadline: form.deadline || null });
      toast("Goal created", "success");
      setShow(false);
      setForm({ title: "", targetAmount: "", deadline: "" });
      refresh();
      window.dispatchEvent(new Event("calexpenses:refresh"));
    } catch (e) { setFormError((e as Error).message); toast((e as Error).message, "error"); }
  };

  const handleContribute = (goalId: string) => {
    if (!contrib) return;
    const a = parseFloat(contrib.amount);
    if (!a || a <= 0) { toast("Enter an amount greater than ₹0", "error"); return; }
    try {
      GoalService.addContribution(goalId, a, new Date().toISOString().slice(0, 10));
      toast("Contribution added", "success");
      setContrib(null);
      refresh();
      window.dispatchEvent(new Event("calexpenses:refresh"));
    } catch (e) { toast((e as Error).message, "error"); }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-7 w-24 rounded" />
          <div className="skeleton h-11 w-28 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}>Goals</h1>
          <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Track what you&apos;re saving for — contributions build toward each target.</p>
        </div>
        <Button onClick={() => setShow(true)} aria-label="Create new goal" style={{ minHeight: 44, borderRadius: "var(--radius-sm)" }}>
          <Icon name="add" size={16} /> New Goal
        </Button>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 border bg-[var(--color-error-bg)] p-3" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium flex items-center gap-2"><Icon name="target" size={16} /> We couldn&apos;t load goals: {loadError}</span>
          <Button variant="secondary" size="sm" onClick={refresh}>Retry</Button>
        </div>
      )}

      {/* Bottom Sheet Create */}
      <BottomSheet open={show} onClose={() => { setShow(false); setFormError(null); }} title="Create savings goal">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New Laptop" aria-required="true" />
          <Input label="Target amount *" type="number" inputMode="decimal" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="60000" aria-required="true" />
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          {formError && <p role="alert" className="text-sm flex items-center gap-1.5" style={{ color: "var(--color-error)" }}><Icon name="target" size={14} /> {formError}</p>}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-[var(--color-surface)] -mx-4 -mb-4 p-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setShow(false)} className="flex-1" style={{ minHeight: 48 }}>Cancel</Button>
            <Button onClick={submit} className="flex-1" style={{ minHeight: 48 }} aria-label="Create goal">Create</Button>
          </div>
          <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>Tip: amount uses tabular numerals — ₹ values align in lists.</p>
        </div>
      </BottomSheet>

      {goals.length === 0 ? <EmptyState onCta={() => setShow(true)} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {goals.map((g) => {
            const current = GoalService.currentAmount(g.id);
            const pct = g.targetAmount ? Math.min((current / g.targetAmount) * 100, 100) : 0;
            const isOverdue = Boolean(g.deadline && g.deadline < new Date().toISOString().slice(0, 10) && current < g.targetAmount);
            const isAchieved = g.status === "achieved" || current >= g.targetAmount;
            const remaining = Math.max(g.targetAmount - current, 0);
            return (
              <Card key={g.id} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold truncate pr-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>{g.title}</h4>
                  <span
                    className="shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-medium"
                    style={{
                      borderRadius: "var(--radius-full)",
                      background: isAchieved ? "var(--color-income-bg)" : isOverdue ? "var(--color-error-bg)" : "var(--color-surface-hover)",
                      color: isAchieved ? "var(--color-income)" : isOverdue ? "var(--color-error)" : "var(--color-text-secondary)",
                      border: `1px solid ${isAchieved ? "var(--color-income)" : isOverdue ? "var(--color-error)" : "var(--color-border)"}20`,
                    }}
                  >
                    {isAchieved ? "✓ Achieved" : isOverdue ? "Overdue" : g.status}
                  </span>
                </div>

                {/* saved / target per §27 */}
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-sm)", color: "var(--color-text-primary)" }}>
                    <span className="tabular-nums">₹{current.toFixed(0)}</span> <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>/</span> <span className="tabular-nums">₹{g.targetAmount.toFixed(0)}</span>
                  </span>
                  <span className="ml-auto text-xs px-2 py-0.5 font-medium" style={{ borderRadius: "var(--radius-full)", background: "var(--color-goal-bg)", color: "var(--color-goal)" }}>{pct.toFixed(0)}%</span>
                </div>

                {/* GoalProgress §38 */}
                <div className="mt-3">
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${g.title} progress ${pct.toFixed(0)} percent`}
                    className="h-2 w-full overflow-hidden"
                    style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)" }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        borderRadius: "var(--radius-full)",
                        background: isAchieved ? "var(--color-income)" : "var(--color-goal)",
                        transition: "width 400ms var(--motion-easing-standard)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
                    <span className="tabular-nums">₹{remaining.toFixed(0)} to go</span>
                    <span>{g.deadline ? `Target: ${g.deadline}` : "No deadline"}</span>
                  </div>
                  {isAchieved && (
                    <div className="mt-2 text-xs font-medium inline-flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--radius-full)", background: "var(--color-income-bg)", color: "var(--color-income)" }}>
                      <Icon name="sparkles" size={12} /> Goal reached
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {contrib?.id === g.id ? (
                    <>
                      <Input type="number" inputMode="decimal" placeholder="Amount" value={contrib.amount} onChange={(e) => setContrib({ id: g.id, amount: e.target.value })} className="max-w-[140px]" aria-label="Contribution amount" />
                      <Button size="sm" onClick={() => handleContribute(g.id)} style={{ minHeight: 44 }} aria-label="Add contribution">Add</Button>
                      <Button variant="secondary" size="sm" onClick={() => setContrib(null)} style={{ minHeight: 44 }}>Cancel</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setContrib({ id: g.id, amount: "" })} style={{ minHeight: 44 }} aria-label={`Contribute to ${g.title}`}>
                      <Icon name="add" size={14} /> Contribute
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setDel(g.id)} style={{ minHeight: 44, color: "var(--color-error)" }} aria-label={`Delete ${g.title}`}>Delete</Button>
                </div>

                {GoalService.getContributionsForGoal(g.id).length > 0 && (
                  <details className="mt-4 group">
                    <summary className="list-none flex items-center gap-1.5 cursor-pointer" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-brand-500)" }}>
                      <Icon name="receipt" size={12} /> History ({GoalService.getContributionsForGoal(g.id).length}) <span className="group-open:rotate-180 transition-transform">⌄</span>
                    </summary>
                    <ul className="mt-2 border rounded-md overflow-hidden" style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                      {GoalService.getContributionsForGoal(g.id).map((c) => (
                        <li key={c.id} className="flex justify-between px-3 py-2 border-b last:border-0" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", fontSize: "var(--font-size-caption)" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>{c.date}</span>
                          <span className="font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>₹{c.amount.toFixed(0)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete goal?" description="Delete goal and its contributions permanently. This cannot be undone." confirmLabel="Delete" onConfirm={() => { if (del) { GoalService.delete(del, { confirmed: true }); toast("Deleted", "success"); setDel(null); refresh(); window.dispatchEvent(new Event("calexpenses:refresh")); } }} />
    </div>
  );
}
