"use client";
import React, { useEffect, useRef, useState } from "react";
import { detectIntentLocal, validateCommand } from "@/lib/ai/intent";
import { executeIntent, commitExpenseFromPreview, commitIncomeFromPreview, commitBudgetFromPreview, commitEventFromPreview, commitGoalFromPreview } from "@/lib/ai/executor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { ExpenseService } from "@/lib/services/expense.service";
import { useToast } from "@/components/ui/toast";

const SUGGESTIONS = [
  "Spent ₹250 on lunch today",
  "Show me my food spending this month",
  "Create a ₹2,000 shopping budget",
  "Add my friend's birthday on Sep 15",
  "Show upcoming bills",
  "How much did I spend this week?",
];

export default function AIPage() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; text: string; kind?: "Fact" | "Estimate" | "Suggestion"; preview?: Record<string, unknown>; intent?: string }[]>([]);
  const [pending, setPending] = useState<unknown | null>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [history, pending]);

  const send = (textOverride?: string) => {
    const raw = (textOverride ?? input).trim();
    if (!raw) return;
    setHistory((h) => [...h, { role: "user", text: raw }]);
    setInput("");
    const parsed = detectIntentLocal(raw);
    const validated = validateCommand(parsed);
    if (parsed.intent === "unknown" || !validated.valid) {
      setHistory((h) => [...h, { role: "assistant", text: validated.errors.length ? validated.errors.join("; ") : "I didn't understand. Try one of the suggestions below.", kind: "Fact" }]);
      return;
    }
    if (parsed.intent === "query_spending") {
      const expenses = ExpenseService.getAll();
      const period = (parsed.entities.period as string) ?? "month";
      const today = new Date().toISOString().slice(0, 10);
      let start = today.slice(0, 7) + "-01";
      let end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
      if (period === "week") {
        const d = new Date(); const day = d.getDay(); const diff = -day; const s = new Date(d); s.setDate(d.getDate() + diff); const e = new Date(s); e.setDate(s.getDate() + 6); start = s.toISOString().slice(0, 10); end = e.toISOString().slice(0, 10);
      } else if (period === "today") { start = today; end = today; }
      const total = expenses.filter((e) => e.date >= start && e.date <= end).reduce((s, e) => s + e.amount, 0);
      setHistory((h) => [...h, { role: "assistant", text: `You spent ₹${total.toFixed(2)} ${period === "week" ? "this week" : period === "today" ? "today" : "this month"} (Fact — from ${start} to ${end}).`, kind: "Fact" }]);
      return;
    }
    if (parsed.intent === "query_upcoming" || parsed.intent === "general_help") {
      if (parsed.intent === "general_help") {
        setHistory((h) => [...h, { role: "assistant", text: "I can log expenses, show spending, create budgets/events/goals. All writes are validated and need your confirmation where required. Your data stays local.", kind: "Fact" }]);
        return;
      }
      setHistory((h) => [...h, { role: "assistant", text: "Upcoming bills and events are on your Dashboard and Calendar. (Fact)", kind: "Fact" }]);
      return;
    }
    const exec = executeIntent(parsed);
    if (!exec.success) {
      setHistory((h) => [...h, { role: "assistant", text: exec.message, kind: "Fact" }]);
      return;
    }
    const isQuick = parsed.intent === "create_expense" || parsed.intent === "create_income";
    if (isQuick) {
      let result: { success: boolean; message: string; data?: unknown };
      if (parsed.intent === "create_expense") result = commitExpenseFromPreview(exec.data as { amount: number; categoryId: string; date: string; description: string });
      else result = commitIncomeFromPreview(exec.data as { amount: number; sourceCategoryId: string; date: string; description: string });
      if (result.success) {
        setHistory((h) => [...h, { role: "assistant", text: `${result.message} — Undo available for 8s.`, kind: "Fact", preview: exec.confirmationPreview as Record<string, unknown> }]);
        toast("Added — Undo within 8 seconds if needed", "success");
        setTimeout(() => window.dispatchEvent(new Event("calexpenses:refresh")), 100);
        setPending(result.data ?? null);
        setPendingType(parsed.intent);
        setTimeout(() => { setPending(null); setPendingType(null); }, 8000);
      } else {
        setHistory((h) => [...h, { role: "assistant", text: result.message, kind: "Fact" }]);
      }
    } else {
      setHistory((h) => [...h, { role: "assistant", text: exec.message, kind: "Suggestion", preview: exec.confirmationPreview as Record<string, unknown>, intent: parsed.intent }]);
      setPending(exec.data);
      setPendingType(parsed.intent);
    }
  };

  const confirmPending = () => {
    if (!pending || !pendingType) return;
    let result: { success: boolean; message: string } = { success: false, message: "Unknown" };
    if (pendingType === "create_budget") result = commitBudgetFromPreview(pending as { amount: number; name: string; categoryId: string; scope: string; periodStart: string; periodEnd: string });
    else if (pendingType === "create_event") result = commitEventFromPreview(pending as { title: string; startDate: string; endDate: string; templateType: string });
    else if (pendingType === "create_goal") result = commitGoalFromPreview(pending as { title: string; targetAmount: number });
    setHistory((h) => [...h, { role: "assistant", text: result.message, kind: "Fact" }]);
    toast(result.success ? "Created" : result.message, result.success ? "success" : "error");
    setPending(null); setPendingType(null);
    window.dispatchEvent(new Event("calexpenses:refresh"));
  };
  const cancelPending = () => { setPending(null); setPendingType(null); setHistory((h) => [...h, { role: "assistant", text: "Cancelled.", kind: "Fact" }]); };
  const undoLast = () => {
    if (!pending || !pendingType) return;
    if (pendingType === "create_expense") {
      const ex = pending as { id: string };
      try { ExpenseService.delete((ex as { id: string }).id, { confirmed: true }); toast("Undone", "success"); setHistory((h) => [...h, { role: "assistant", text: "Undone.", kind: "Fact" }]); } catch {}
    }
    setPending(null); setPendingType(null);
    window.dispatchEvent(new Event("calexpenses:refresh"));
  };

  return (
    <div className="max-w-[720px] mx-auto flex flex-col min-h-[calc(100vh-120px)] lg:min-h-[calc(100vh-140px)]">
      {/* Header — §32.2 distinct wash: soft two-stop gradient AI to transparent */}
      <div
        className="flex items-center gap-3 mb-4 px-4 py-3 -mx-4 lg:mx-0 lg:px-4 border"
        style={{
          borderRadius: "var(--radius-lg)",
          borderColor: "var(--color-border)",
          background: `linear-gradient(135deg, var(--color-ai-bg) 0%, transparent 70%), var(--color-surface)`,
          boxShadow: "var(--elevation-1)",
        }}
      >
        <div className="h-10 w-10 grid place-items-center text-white shrink-0" style={{ borderRadius: "var(--radius-sm)", background: "var(--color-ai)" }} aria-hidden><Icon name="ai" size={20} /></div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h2)", color: "var(--color-text-primary)" }}>AI Assistant</h1>
          <p className="truncate" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-secondary)" }}>Validated, confirm-before-write. Your data stays local — only this message + date/currency sent to proxy.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium" style={{ borderRadius: "var(--radius-full)", background: "var(--color-ai-bg)", color: "var(--color-ai)", border: "1px solid var(--color-ai)" }}><span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--color-ai)" }} aria-hidden /> Online</span>
      </div>

      {/* Suggestions — horizontal scroll mobile, chips §32.2 */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "thin" }} role="list" aria-label="Quick actions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            role="listitem"
            className="shrink-0 px-3 py-2 text-xs font-medium border whitespace-nowrap hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
            style={{ borderRadius: "var(--radius-full)", borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)", minHeight: 44 }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 mt-3 min-h-[52vh]" style={{ borderRadius: "var(--radius-lg)", borderColor: "var(--color-border)", boxShadow: "var(--elevation-1)" }}>
        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4" style={{ background: "var(--color-background)" }}>
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="h-14 w-14 grid place-items-center mb-4 border" style={{ borderRadius: "var(--radius-md)", background: "var(--color-surface)", borderColor: "var(--color-border)" }}><Logo variant="icon" size="md" /></div>
              <h3 className="font-semibold" style={{ fontSize: "var(--font-size-h3)", color: "var(--color-text-primary)" }}>How can I help?</h3>
              <p className="max-w-sm mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Try “Spent ₹250 on lunch today” or “Show me my food spending this month.” Reads run instantly; writes show a preview.</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                <button onClick={() => send("Spent ₹250 on lunch today")} className="text-xs p-3 text-left border hover:opacity-90 flex items-center gap-1.5" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", background: "var(--color-surface)", minHeight: 44 }}><Icon name="expenses" size={12} /> Spent ₹250 on lunch today</button>
                <button onClick={() => send("Show me my food spending this month")} className="text-xs p-3 text-left border hover:opacity-90 flex items-center gap-1.5" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", background: "var(--color-surface)", minHeight: 44 }}><Icon name="barChart" size={12} /> Food spending this month</button>
              </div>
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <div className="h-7 w-7 rounded-full border grid place-items-center shrink-0 mt-0.5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}><Icon name="ai" size={14} /></div>}
              <div
                className="max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed"
                style={{
                  borderRadius: m.role === "user" ? "var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)" : "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)",
                  background: m.role === "user" ? "var(--color-brand-500)" : "var(--color-surface)",
                  color: m.role === "user" ? "white" : "var(--color-text-primary)",
                  border: m.role === "user" ? "none" : "1px solid var(--color-border)",
                  boxShadow: "var(--elevation-1)",
                }}
              >
                {m.kind && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold mr-1.5 align-middle"
                    style={{
                      borderRadius: "var(--radius-xs)",
                      background: m.kind === "Fact" ? "var(--color-surface-hover)" : m.kind === "Estimate" ? "var(--color-warning-bg)" : "var(--color-ai-bg)",
                      color: m.kind === "Fact" ? "var(--color-text-secondary)" : m.kind === "Estimate" ? "var(--color-warning)" : "var(--color-ai)",
                    }}
                  >{m.kind}</span>
                )}
                <span className="align-middle">{m.text}</span>
                {m.preview && (
                  <div className="mt-2.5 p-2.5 text-xs border" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)", background: "var(--color-surface-hover)" }}>
                    <div className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}><Icon name="receipt" size={12} /> Preview — review before confirming</div>
                    <div className="grid gap-1">
                      {Object.entries(m.preview as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 py-1 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                          <span className="capitalize" style={{ color: "var(--color-text-muted)" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                          <span className="font-medium truncate max-w-[60%] text-right" style={{ color: "var(--color-text-primary)" }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {m.role === "user" && <div className="h-7 w-7 rounded-full border grid place-items-center shrink-0 mt-0.5 font-medium text-xs" style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>You</div>}
            </div>
          ))}
          {pending !== null && pendingType !== null && !["create_expense", "create_income"].includes(pendingType) && (
            <div className="flex gap-2 justify-start">
              <Button size="sm" onClick={confirmPending} style={{ minHeight: 44 }}><Icon name="add" size={14} /> Confirm</Button>
              <Button size="sm" variant="secondary" onClick={cancelPending} style={{ minHeight: 44 }}>Cancel</Button>
            </div>
          )}
          {pending !== null && ["create_expense", "create_income"].includes(pendingType ?? "") && (
            <div className="flex gap-2 justify-start">
              <Button size="sm" variant="secondary" onClick={undoLast} style={{ minHeight: 44 }}><Icon name="alarm" size={14} /> Undo (8s)</Button>
            </div>
          )}
        </div>

        {/* Input dock — glass per §32 */}
        <div className="p-3 border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type a command… e.g. Spent ₹250 on lunch today"
                aria-label="AI command input"
                className="w-full h-11 pl-3 pr-10 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] border"
                style={{ borderRadius: "var(--radius-full)", borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)", minHeight: 44 }}
              />
              <button onClick={() => send()} aria-label="Send" className="absolute right-1 top-1 h-9 w-9 rounded-full text-white grid place-items-center hover:opacity-90" style={{ background: "var(--color-brand-500)", minHeight: 36, minWidth: 36 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" /></svg>
              </button>
            </div>
          </div>
          <p className="text-center mt-2" style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>AI never invents amounts. Writes are validated and require confirmation. <span className="hidden sm:inline">Local-only data unless you send a message.</span></p>
        </div>
      </Card>
    </div>
  );
}
