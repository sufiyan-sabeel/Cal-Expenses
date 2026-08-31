"use client";
import React, { useState } from "react";
import { detectIntentLocal, validateCommand } from "@/lib/ai/intent";
import { executeIntent, commitExpenseFromPreview, commitIncomeFromPreview, commitBudgetFromPreview, commitEventFromPreview, commitGoalFromPreview } from "@/lib/ai/executor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ExpenseService } from "@/lib/services/expense.service";
import { CategoryService } from "@/lib/services/category.service";
import { useToast } from "@/components/ui/toast";

export default function AIPage() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; text: string; kind?: "Fact" | "Estimate" | "Suggestion"; preview?: any; intent?: string }[]>([]);
  const [pending, setPending] = useState<any | null>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const send = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setHistory((h) => [...h, { role: "user", text: userText }]);
    setInput("");
    // local intent detection (would call proxy in prod)
    const parsed = detectIntentLocal(userText);
    const validated = validateCommand(parsed);
    if (parsed.intent === "unknown" || !validated.valid) {
      setHistory((h) => [...h, { role: "assistant", text: validated.errors.length ? validated.errors.join("; ") : "I didn't understand. Try: 'Spent ₹250 on lunch today' or 'Show me my food spending this month.'", kind: "Fact" }]);
      return;
    }
    // read queries
    if (parsed.intent === "query_spending") {
      const cats = CategoryService.getAll();
      const expenses = ExpenseService.getAll();
      const period = (parsed.entities.period as string) ?? "month";
      // deterministic calculation
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
        setHistory((h) => [...h, { role: "assistant", text: "I can: log expenses ('Spent ₹250 on lunch today'), show spending, create budgets/events/goals. All writes are validated and need your confirmation where required. Your data stays local.", kind: "Fact" }]);
        return;
      }
      setHistory((h) => [...h, { role: "assistant", text: "Upcoming bills and events are on your Dashboard and Calendar. (Fact)", kind: "Fact" }]);
      return;
    }
    // write intents -> preview
    const exec = executeIntent(parsed);
    if (!exec.success) {
      setHistory((h) => [...h, { role: "assistant", text: exec.message, kind: "Fact" }]);
      return;
    }
    // quick-add-undo vs always-confirm logic simplified: expense/income = undo toast, others = confirmation
    const isQuick = parsed.intent === "create_expense" || parsed.intent === "create_income";
    if (isQuick) {
      // auto-create with undo
      let result;
      if (parsed.intent === "create_expense") result = commitExpenseFromPreview(exec.data as any);
      else result = commitIncomeFromPreview(exec.data as any);
      if (result.success) {
        setHistory((h) => [...h, { role: "assistant", text: result.message + " — Undo available for 8s.", kind: "Fact", preview: exec.confirmationPreview }]);
        toast("Added — Undo within 8 seconds if needed", "success");
        setTimeout(() => window.dispatchEvent(new Event("calexpenses:refresh")), 100);
        // store pending for undo
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
    // undo last expense/income
    if (pendingType === "create_expense") {
      const ex = pending as { id: string };
      try { ExpenseService.delete((ex as any).id, { confirmed: true }); toast("Undone", "success"); setHistory((h) => [...h, { role: "assistant", text: "Undone.", kind: "Fact" }]); } catch {}
    }
    setPending(null); setPendingType(null);
    window.dispatchEvent(new Event("calexpenses:refresh"));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">AI Assistant</h1>
      <p className="text-sm text-[var(--text-secondary)]">Try: “Spent ₹250 on lunch today.” “Show me my food spending this month.” “Create a ₹2,000 shopping budget.” Reads execute immediately; writes show a preview and need confirmation (or quick undo).</p>

      <Card className="h-[56vh] overflow-auto p-4 space-y-3 bg-[var(--surface-canvas)]">
        {history.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No messages yet. Start by typing below.</p>}
        {history.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === "user" ? "ml-auto bg-[var(--surface-elevated-2)]" : "mr-auto bg-[var(--surface-elevated-1)] border border-[var(--border-subtle)]"}`}>
            {m.kind && <span className={`text-[10px] px-1.5 py-0.5 rounded mr-2 font-medium ${m.kind === "Fact" ? "bg-[var(--surface-elevated-2)]" : m.kind === "Estimate" ? "bg-[var(--semantic-neutral-info)]/15 text-[var(--semantic-neutral-info)]" : "bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]"}`}>{m.kind}</span>}
            {m.text}
            {m.preview && (
              <div className="mt-2 border border-[var(--border-subtle)] rounded-md p-2 bg-[var(--surface-elevated-2)] text-xs">
                <div className="font-medium mb-1">Preview — review before confirming:</div>
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(m.preview, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
        {pending && pendingType && !["create_expense", "create_income"].includes(pendingType) && (
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmPending}>Confirm</Button>
            <Button size="sm" variant="secondary" onClick={cancelPending}>Cancel</Button>
          </div>
        )}
        {pending && ["create_expense", "create_income"].includes(pendingType ?? "") && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={undoLast}>Undo (8s)</Button>
          </div>
        )}
      </Card>

      <div className="flex gap-2 items-center sticky bottom-[68px] lg:bottom-4 bg-[var(--surface-elevated-1)]/80 backdrop-blur p-2 rounded-lg border border-[var(--border-subtle)] shadow-e1">
        <Input placeholder="Type a command…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1" />
        <Button onClick={send}>Send</Button>
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">Privacy: only this message + current date/currency/category list is sent to the AI proxy. Never a bulk data dump.</p>
    </div>
  );
}
