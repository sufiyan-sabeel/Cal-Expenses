/**
 * Validation layer — deterministic, shared by manual UI and AI executor
 */
import type { Expense, Income, Budget, Goal, Event, Gift, FamilyMember, Category } from "../domain/models";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

export function validateAmount(amount: unknown): string | null {
  if (typeof amount !== "number" || isNaN(amount)) return "Amount must be a number";
  if (amount <= 0) return "Amount must be greater than 0";
  if (!Number.isFinite(amount)) return "Amount is not finite";
  const decimals = amount.toString().split(".")[1];
  if (decimals && decimals.length > 2) return "Amount can have at most 2 decimal places";
  if (amount > 1_000_000_000) return "Amount is too large";
  return null;
}

export function validateISODate(date: unknown): string | null {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Date must be YYYY-MM-DD";
  const d = new Date(date + "T00:00:00");
  if (isNaN(d.getTime())) return "Invalid date";
  return null;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "").trim().slice(0, 500);
}

export function validateExpense(data: Partial<Expense> & { amount?: number; date?: string; categoryId?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  const amtErr = validateAmount(data.amount as number);
  if (amtErr) errors.amount = amtErr;
  const dateErr = validateISODate(data.date);
  if (dateErr) errors.date = dateErr;
  else {
    // future ceiling 1 year
    const d = new Date(data.date! + "T00:00:00");
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    if (d > max) errors.date = "Date cannot be more than 1 year in the future";
  }
  if (!data.categoryId) errors.categoryId = "Category is required";
  if (data.merchant && data.merchant.length > 100) errors.merchant = "Merchant too long (max 100)";
  if (data.notes && data.notes.length > 1000) errors.notes = "Notes too long (max 1000)";
  if (data.tags && data.tags.length > 20) errors.tags = "Too many tags (max 20)";
  if (data.paymentMethod && data.paymentMethod.length > 50) errors.paymentMethod = "Payment method too long";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateIncome(data: Partial<Income> & { amount?: number; date?: string; sourceCategoryId?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  const amtErr = validateAmount(data.amount as number);
  if (amtErr) errors.amount = amtErr;
  const dateErr = validateISODate(data.date);
  if (dateErr) errors.date = dateErr;
  if (!data.sourceCategoryId) errors.sourceCategoryId = "Income source is required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateBudget(data: Partial<Budget> & { amount?: number; name?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.name || data.name.trim().length < 2) errors.name = "Budget name must be at least 2 characters";
  const amtErr = validateAmount(data.amount as number);
  if (amtErr) errors.amount = amtErr;
  if (!data.scope) errors.scope = "Budget scope required";
  if (data.alertThresholds) {
    for (const t of data.alertThresholds) {
      if (t <= 0 || t > 200) errors.alertThresholds = "Thresholds must be 0-200";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateGoal(data: Partial<Goal> & { targetAmount?: number; title?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.title || data.title.trim().length < 2) errors.title = "Goal title required";
  const amtErr = validateAmount(data.targetAmount as number);
  if (amtErr) errors.targetAmount = amtErr;
  if (data.deadline) {
    const e = validateISODate(data.deadline);
    if (e) errors.deadline = e;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEvent(data: Partial<Event> & { title?: string; startDate?: string; endDate?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.title || data.title.trim().length < 2) errors.title = "Event title required";
  const sErr = validateISODate(data.startDate);
  if (sErr) errors.startDate = sErr;
  const eErr = validateISODate(data.endDate);
  if (eErr) errors.endDate = eErr;
  if (!sErr && !eErr && data.startDate! > data.endDate!) errors.endDate = "End date cannot be before start";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateGift(data: Partial<Gift> & { recipient?: string; budget?: number; date?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.recipient || data.recipient.trim().length < 1) errors.recipient = "Recipient required";
  const amtErr = validateAmount(data.budget as number);
  if (amtErr) errors.budget = amtErr;
  const dErr = validateISODate(data.date);
  if (dErr) errors.date = dErr;
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateFamilyMember(data: Partial<FamilyMember> & { name?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.name || data.name.trim().length < 1) errors.name = "Name required";
  if (data.birthday) {
    const e = validateISODate(data.birthday);
    if (e) errors.birthday = e;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCategory(data: Partial<Category> & { name?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.name || data.name.trim().length < 1) errors.name = "Category name required";
  if (data.name && data.name.length > 30) errors.name = "Category name too long (max 30)";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRecurring(data: {
  amount?: number;
  startDate?: string;
  frequency?: string;
  customIntervalDays?: number | null;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const amtErr = validateAmount(data.amount as number);
  if (amtErr) errors.amount = amtErr;
  const dErr = validateISODate(data.startDate);
  if (dErr) errors.startDate = dErr;
  if (!data.frequency) errors.frequency = "Frequency required";
  if (data.frequency === "custom" && (!data.customIntervalDays || data.customIntervalDays < 1)) {
    errors.customIntervalDays = "Custom interval must be >=1 day";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
