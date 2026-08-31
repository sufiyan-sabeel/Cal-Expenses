/**
 * AI Intent detection — deterministic rule-based fallback + LLM proxy stub.
 * Must be validated via schemas, never directly mutates storage.
 */
export type IntentType =
  | "create_expense"
  | "create_income"
  | "query_spending"
  | "create_event"
  | "create_budget"
  | "create_goal"
  | "query_budget_status"
  | "query_upcoming"
  | "create_reminder"
  | "general_help"
  | "unknown";

export interface ParsedIntent {
  intent: IntentType;
  confidence: number;
  entities: Record<string, string | number | null>;
  raw: string;
}

const expenseRegex = /(spent|paid|expense|kharch).+?(\d+(\.\d+)?)/i;
const incomeRegex = /(received|income|earned|salary).+?(\d+(\.\d+)?)/i;
const budgetRegex = /(budget).+?(\d+)/i;
const eventRegex = /(birthday|event|trip|wedding|festival).+?(on\s+)?(\d{1,2}[\/-]\d{1,2}|\w+\s+\d{1,2}|\d{4}-\d{2}-\d{2})/i;

export function detectIntentLocal(text: string): ParsedIntent {
  const raw = text;
  const lower = text.toLowerCase();

  // Expense: "Spent ₹250 on lunch today"
  if (expenseRegex.test(text) || (/\b\d+/.test(text) && /(lunch|dinner|food|transport|shopping|bill)/i.test(text))) {
    const amtMatch = text.match(/₹?\s?(\d+(\.\d+)?)/);
    const amount = amtMatch ? parseFloat(amtMatch[1]!) : null;
    // simple category inference
    let category: string | null = null;
    if (/food|lunch|dinner|breakfast/i.test(text)) category = "Food";
    else if (/transport|bus|uber|metro/i.test(text)) category = "Transport";
    else if (/shopping|clothes/i.test(text)) category = "Shopping";
    else if (/bill|electricity|rent/i.test(text)) category = "Bills";
    else category = "Other";
    // date inference
    let date: string | null = null;
    if (/today/i.test(text)) date = new Date().toISOString().slice(0, 10);
    else if (/yesterday/i.test(text)) {
      const d = new Date(); d.setDate(d.getDate() - 1); date = d.toISOString().slice(0, 10);
    }
    return { intent: "create_expense", confidence: amount ? 0.85 : 0.5, entities: { amount, category, date, description: text.slice(0, 100) }, raw };
  }

  if (incomeRegex.test(text)) {
    const amtMatch = text.match(/(\d+(\.\d+)?)/);
    const amount = amtMatch ? parseFloat(amtMatch[1]!) : null;
    return { intent: "create_income", confidence: amount ? 0.8 : 0.5, entities: { amount, date: new Date().toISOString().slice(0, 10) }, raw };
  }

  if (/show.*spend|how much.*spend|spending/i.test(lower)) {
    return { intent: "query_spending", confidence: 0.9, entities: { period: lower.includes("week") ? "week" : lower.includes("month") ? "month" : lower.includes("today") ? "today" : "month" }, raw };
  }

  if (budgetRegex.test(text) && /create|make|set/i.test(lower)) {
    const amtMatch = text.match(/(\d+)/);
    const amount = amtMatch ? parseFloat(amtMatch[1]!) : null;
    return { intent: "create_budget", confidence: 0.75, entities: { amount, name: "Budget", scope: "category" }, raw };
  }

  if (/upcoming|next|bills|events/i.test(lower) && /show/i.test(lower)) {
    return { intent: "query_upcoming", confidence: 0.8, entities: { type: lower.includes("bill") ? "bills" : "events" }, raw };
  }

  if (eventRegex.test(text) || (/birthday/i.test(lower) && /add/i.test(lower))) {
    // extract date like September 15 - simplified
    return { intent: "create_event", confidence: 0.7, entities: { title: text.slice(0, 50), date: null }, raw };
  }

  if (/goal|save|saving/i.test(lower) && /create/i.test(lower)) {
    const amtMatch = text.match(/(\d+)/);
    const amount = amtMatch ? parseFloat(amtMatch[1]!) : null;
    return { intent: "create_goal", confidence: 0.7, entities: { amount, title: "Savings Goal" }, raw };
  }

  if (/help|what can you do/i.test(lower)) {
    return { intent: "general_help", confidence: 1, entities: {}, raw };
  }

  // fallback: if contains number and create/add -> expense
  if (/\b(add|create)\b/i.test(lower) && /\d+/.test(lower)) {
    const amtMatch = text.match(/(\d+(\.\d+)?)/);
    return { intent: "create_expense", confidence: 0.4, entities: { amount: amtMatch ? parseFloat(amtMatch[1]!) : null, category: "Other", date: new Date().toISOString().slice(0, 10) }, raw };
  }

  return { intent: "unknown", confidence: 0, entities: {}, raw };
}

export interface CommandSchema {
  intent: IntentType;
  valid: boolean;
  errors: string[];
  payload: Record<string, unknown>;
}

export function validateCommand(intent: ParsedIntent): CommandSchema {
  const errors: string[] = [];
  if (intent.intent === "create_expense") {
    if (!intent.entities.amount || (intent.entities.amount as number) <= 0) errors.push("Amount is required and must be >0");
    if (!intent.entities.category) errors.push("Category inference failed");
  }
  if (intent.intent === "create_income") {
    if (!intent.entities.amount || (intent.entities.amount as number) <= 0) errors.push("Amount required");
  }
  if (intent.intent === "create_budget") {
    if (!intent.entities.amount || (intent.entities.amount as number) <= 0) errors.push("Budget amount required");
  }
  if (intent.intent === "create_event") {
    if (!intent.entities.title) errors.push("Event title required");
  }
  return { intent: intent.intent, valid: errors.length === 0, errors, payload: intent.entities as Record<string, unknown> };
}
