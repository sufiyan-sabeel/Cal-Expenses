"use client";
import React, { useState, useRef, useEffect } from "react";
import { detectIntentLocal, validateCommand } from "@/lib/ai/intent";
import { executeIntent, commitExpenseFromPreview, commitIncomeFromPreview, commitBudgetFromPreview, commitEventFromPreview, commitGoalFromPreview } from "@/lib/ai/executor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { ExpenseService } from "@/lib/services/expense.service";
import { CategoryService } from "@/lib/services/category.service";
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
  const [history, setHistory] = useState<{ role: "user" | "assistant"; text: string; kind?: "Fact" | "Estimate" | "Suggestion"; preview?: any; intent?: string }[]>([]);
  const [pending, setPending] = useState<any | null>(null);
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
      let result;
      if (parsed.intent === "create_expense") result = commitExpenseFromPreview(exec.data as any);
      else result = commitIncomeFromPreview(exec.data as any);
      if (result.success) {
        setHistory((h) => [...h, { role: "assistant", text: result.message + " — Undo available for 8s.", kind: "Fact", preview: exec.confirmationPreview }]);
        toast("Added — Undo within 8 seconds if needed", "success");
        setTimeout(() => window.dispatchEvent(new Event("calexpenses:refresh")), 100);
        setPending(result.data);
        setPendingType(parsed.intent);
        setTimeout(() => { setPending(null); setPendingType(null); }, 8000);
      } else {
        setHistory((h) => [...h, { role: "assistant", text: result.message, kind: "Fact" }]);
      }
    } else {
      setHistory((h) => [...h, { role: "assistant", text: exec.message, kind: "Suggestion", preview: exec.confirmationPreview, intent: parsed.intent }]);
      setPending(exec.data);
      setPendingType(parsed.intent);
    }
  };

  const confirmPending = () => {
    if (!pending || !pendingType) return;
    let result: any;
    if (pendingType === "create_budget") result = commitBudgetFromPreview(pending);
    else if (pendingType === "create_event") result = commitEventFromPreview(pending);
    else if (pendingType === "create_goal") result = commitGoalFromPreview(pending);
    else result = { success: false, message: "Unknown" };
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
      try { ExpenseService.delete((ex as any).id, { confirmed: true }); toast("Undone", "success"); setHistory((h) => [...h, { role: "assistant", text: "Undone.", kind: "Fact" }]); } catch {}
    }
    setPending(null); setPendingType(null);
    window.dispatchEvent(new Event("calexpenses:refresh"));
  };

  return (
    <div className="max-w-[720px] mx-auto flex flex-col min-h-[calc(100vh-120px)] lg:min-h-[calc(100vh-140px)]">
      {/* Header — stitch premium */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-[var(--accent-primary)] grid place-items-center text-white"><Icon name="ai" size={20} /></div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">AI Assistant</h1>
          <p className="text-xs text-[var(--text-secondary)] truncate">Validated, confirm-before-write. Your data stays local — only this message + date/currency sent to proxy.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] font-medium"><span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" /> Online</span>
      </div>

      {/* Suggestions — horizontal scroll mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="shrink-0 text-xs px-3 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] hover:bg-[var(--surface-elevated-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap">
            {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 mt-3 min-h-[52vh]">
        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4 bg-[var(--surface-canvas)]">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="h-14 w-14 rounded-xl bg-[var(--surface-elevated-1)] border border-[var(--border-subtle)] grid place-items-center mb-4"><Logo variant="icon" size="md" /></div>
              <h3 className="font-semibold">How can I help?</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">Try “Spent ₹250 on lunch today” or “Show me my food spending this month.” Reads run instantly; writes show a preview.</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                <button onClick={() => send("Spent ₹250 on lunch today")} className="text-xs p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] text-left hover:bg-[var(--surface-elevated-2)]">💸 Spent ₹250 on lunch today</button>
                <button onClick={() => send("Show me my food spending this month")} className="text-xs p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] text-left hover:bg-[var(--surface-elevated-2)]">📊 Food spending this month</button>
              </div>
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <div className="h-7 w-7 rounded-full bg-[var(--surface-elevated-1)] border border-[var(--border-subtle)] grid place-items-center shrink-0 mt-0.5"><Icon name="ai" size={14} /></div>}
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "bg-[var(--accent-primary)] text-white rounded-br-sm" : "bg-[var(--surface-elevated-1)] border border-[var(--border-subtle)] rounded-bl-sm"}`}>
                {m.kind && <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium mr-1.5 align-middle ${m.kind === "Fact" ? "bg-[var(--surface-elevated-2)] text-[var(--text-secondary)]" : m.kind === "Estimate" ? "bg-[var(--semantic-neutral-info)]/15 text-[var(--semantic-neutral-info)]" : "bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]"}`}>{m.kind}</span>}
                <span className="align-middle">{m.text}</span>
                {m.preview && (
                  <div className="mt-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated-2)] p-2.5 text-xs">
                    <div className="font-medium mb-1.5 flex items-center gap-1.5"><Icon name="receipt" size={12} /> Preview — review before confirming</div>
                    <div className="grid gap-1">
                      {Object.entries(m.preview as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 py-1 border-b border-[var(--border-subtle)] last:border-0">
                          <span className="text-[var(--text-tertiary)] capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                          <span className="font-medium text-[var(--text-primary)] truncate max-w-[60%] text-right">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {m.role === "user" && <div className="h-7 w-7 rounded-full bg-[var(--surface-elevated-2)] border border-[var(--border-subtle)] grid place-items-center shrink-0 mt-0.5 font-medium text-xs">You</div>}
            </div>
          ))}
          {pending && pendingType && !["create_expense", "create_income"].includes(pendingType) && (
            <div className="flex gap-2 justify-start">
              <Button size="sm" onClick={confirmPending}><Icon name="add" size={14} /> Confirm</Button>
              <Button size="sm" variant="secondary" onClick={cancelPending}>Cancel</Button>
            </div>
          )}
          {pending && ["create_expense", "create_income"].includes(pendingType ?? "") && (
            <div className="flex gap-2 justify-start">
              <Button size="sm" variant="secondary" onClick={undoLast}><Icon name="alarm" size={14} /> Undo (8s)</Button>
            </div>
          )}
        </div>

        {/* Input dock — glass */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated-1)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface-elevated-1)]/80">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type a command… e.g. Spent ₹250 on lunch today"
                className="w-full h-11 pl-3 pr-10 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button onClick={() => send()} aria-label="Send" className="absolute right-1 top-1 h-9 w-9 rounded-full bg-[var(--accent-primary)] text-white grid place-items-center hover:opacity-90">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" /></svg>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-2 text-center">AI never invents amounts. Writes are validated and require confirmation.</p>
        </div>
      </Card>
    </div>
  );
}
