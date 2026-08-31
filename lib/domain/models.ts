import type { BaseEntity, ISODateString, ISODateTimeString, UUID } from "./common";

export interface UserProfile extends BaseEntity {
  authUid: string;
  displayName: string;
  email: string;
  authProvider: "google" | "password";
  currency: string;
  locale: string;
  dateFormat: "DMY" | "MDY" | "YMD";
  timezone: string;
  firstDayOfWeek: 0 | 1;
  theme: "light" | "dark" | "system";
  startingBalance: number;
  defaultCategoryId: UUID | null;
  defaultPaymentMethod: string | null;
  defaultBudgetPeriod: "monthly" | "custom";
  aiEnabled: boolean;
  aiConfirmationMode: "always-confirm" | "quick-add-undo";
  aiInsightFrequency: "daily" | "weekly" | "off";
  onboardingCompleted: boolean;
}

export interface Category extends BaseEntity {
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  isSystem: boolean;
  parentId: UUID | null;
}

export interface Expense extends BaseEntity {
  amount: number;
  currency: string;
  categoryId: UUID;
  subcategory: string | null;
  date: ISODateString;
  time: string | null;
  merchant: string | null;
  description: string | null;
  paymentMethod: string | null;
  tags: string[];
  notes: string | null;
  recurringSourceId: UUID | null;
  eventId: UUID | null;
  giftId: UUID | null;
  createdVia: "manual" | "ai" | "recurring" | "import";
}

export interface Income extends BaseEntity {
  amount: number;
  currency: string;
  sourceCategoryId: UUID;
  date: ISODateString;
  description: string | null;
  notes: string | null;
  recurringSourceId: UUID | null;
  refundOfExpenseId: UUID | null;
  createdVia: "manual" | "ai" | "recurring" | "import";
}

export interface Budget extends BaseEntity {
  name: string;
  scope: "category" | "event" | "family" | "custom";
  categoryId: UUID | null;
  eventId: UUID | null;
  familyMemberIds: UUID[];
  amount: number;
  periodStart: ISODateString;
  periodEnd: ISODateString | null;
  recurring: boolean;
  rollover: boolean;
  rolloverMode: "both" | "surplus-only";
  alertThresholds: number[];
}

export interface Goal extends BaseEntity {
  title: string;
  targetAmount: number;
  deadline: ISODateString | null;
  status: "active" | "achieved" | "abandoned" | "overdue";
}

export interface GoalContribution extends BaseEntity {
  goalId: UUID;
  amount: number;
  date: ISODateString;
  note: string | null;
  linkedIncomeId: UUID | null;
}

export interface RecurringTransaction extends BaseEntity {
  type: "income" | "expense";
  amount: number;
  categoryId: UUID;
  startDate: ISODateString;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom";
  customIntervalDays: number | null;
  endDate: ISODateString | null;
  occurrenceCount: number | null;
  lastGeneratedDate: ISODateString | null;
  nextOccurrenceDate: ISODateString | null;
  status: "active" | "paused" | "ended";
  autoCreate: boolean;
  reminderDaysBefore: number;
}

export interface PlannedExpenseLine { label: string; estimatedAmount: number; }

export interface Event extends BaseEntity {
  title: string;
  templateType: "birthday" | "trip" | "wedding" | "festival" | "school" | "family" | "shopping" | "other";
  startDate: ISODateString;
  endDate: ISODateString;
  time: string | null;
  location: string | null;
  notes: string | null;
  familyMemberIds: UUID[];
  freeTextPeople: string[];
  budget: number | null;
  plannedExpenses: PlannedExpenseLine[];
  reminderDaysBefore: number;
}

export interface Gift extends BaseEntity {
  recipient: string;
  familyMemberId: UUID | null;
  occasion: string;
  date: ISODateString;
  budget: number;
  plannedGift: string | null;
  purchasedStatus: "planned" | "purchased";
  actualCost: number | null;
  notes: string | null;
  reminderDaysBefore: number;
  eventId: UUID | null;
  linkedExpenseId: UUID | null;
}

export interface FamilyMember extends BaseEntity {
  name: string;
  relationship: string | null;
  color: string;
  notes: string | null;
  birthday: ISODateString | null;
}

export interface Reminder extends BaseEntity {
  title: string;
  dueDate: ISODateString;
  sourceType: "recurring" | "event" | "gift" | "budget" | "goal" | "manual";
  sourceId: UUID | null;
  status: "pending" | "dismissed" | "actioned";
}

export type TriggerType = "expense_created" | "budget_utilization" | "due_within_days" | "goal_progress";
export type ActionType = "notify" | "generate_insight" | "create_reminder";
export interface Automation extends BaseEntity {
  name: string;
  enabled: boolean;
  trigger: { type: TriggerType; params: Record<string, number | string> };
  conditions: { field: string; operator: ">" | ">=" | "<" | "<=" | "=="; value: number | string }[];
  action: { type: ActionType; params: Record<string, string> };
  lastRunAt: ISODateTimeString | null;
  lastRunStatus: "success" | "failed" | null;
  failureReason: string | null;
}

export interface AutomationExecution extends BaseEntity {
  automationId: UUID;
  firedAt: ISODateTimeString;
  result: "success" | "failed";
  detail: string;
}

export interface AIInsight extends BaseEntity {
  kind: "fact" | "estimate" | "suggestion";
  message: string;
  linkedView: string;
  supportingCalculation: string;
  dismissed: boolean;
}

export interface AppSettings extends BaseEntity {
  upcomingBillsWindowDays: number;
  upcomingEventsWindowDays: number;
  notificationMutes: string[];
}

export interface ExportPackage {
  schemaVersion: number;
  exportedAt: ISODateTimeString;
  profile: UserProfile | null;
  categories: Category[];
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  recurringTransactions: RecurringTransaction[];
  events: Event[];
  gifts: Gift[];
  familyMembers: FamilyMember[];
  reminders: Reminder[];
  automations: Automation[];
  automationExecutions: AutomationExecution[];
  aiInsights: AIInsight[];
  settings: AppSettings | null;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Food", icon: "utensils", color: "#E0563F", type: "expense", isSystem: true, parentId: null },
  { name: "Transport", icon: "bus", color: "#5B8DEF", type: "expense", isSystem: true, parentId: null },
  { name: "Shopping", icon: "shopping-bag", color: "#B15FCF", type: "expense", isSystem: true, parentId: null },
  { name: "Bills", icon: "receipt", color: "#C98A1F", type: "expense", isSystem: true, parentId: null },
  { name: "Entertainment", icon: "film", color: "#1D8FA6", type: "expense", isSystem: true, parentId: null },
  { name: "Health", icon: "heart", color: "#E85D75", type: "expense", isSystem: true, parentId: null },
  { name: "Education", icon: "graduation-cap", color: "#5B5F97", type: "expense", isSystem: true, parentId: null },
  { name: "Gifts", icon: "gift", color: "#B15FCF", type: "expense", isSystem: true, parentId: null },
  { name: "Other", icon: "more-horizontal", color: "#8A8A90", type: "expense", isSystem: true, parentId: null },
  { name: "Salary", icon: "briefcase", color: "#1F9D6B", type: "income", isSystem: true, parentId: null },
  { name: "Allowance", icon: "wallet", color: "#1F9D6B", type: "income", isSystem: true, parentId: null },
  { name: "Freelance", icon: "laptop", color: "#1F9D6B", type: "income", isSystem: true, parentId: null },
  { name: "Gift Income", icon: "gift", color: "#1F9D6B", type: "income", isSystem: true, parentId: null },
  { name: "Refund", icon: "rotate-ccw", color: "#1F9D6B", type: "income", isSystem: true, parentId: null },
  { name: "Other Income", icon: "plus", color: "#1F9D6B", type: "income", isSystem: true, parentId: null },
];

export const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"] as const;
export const SUPPORTED_LOCALES = ["en-IN", "en-US", "en-GB"] as const;

export function createDefaultSettings(): Omit<AppSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    upcomingBillsWindowDays: 7,
    upcomingEventsWindowDays: 14,
    notificationMutes: [],
  };
}
