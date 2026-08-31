export const STORAGE_PREFIX = "calexpenses";
export const SCHEMA_VERSION = 1;

export function ns(key: string): string {
  return `${STORAGE_PREFIX}:v${SCHEMA_VERSION}:${key}`;
}

export const StorageKeys = {
  profile: ns("profile"),
  categories: ns("categories"),
  expenses: ns("expenses"),
  income: ns("income"),
  budgets: ns("budgets"),
  goals: ns("goals"),
  goalContributions: ns("goalContributions"),
  recurring: ns("recurring"),
  events: ns("events"),
  gifts: ns("gifts"),
  family: ns("family"),
  reminders: ns("reminders"),
  automations: ns("automations"),
  automationExecutions: ns("automationExecutions"),
  aiInsights: ns("aiInsights"),
  settings: ns("settings"),
  schemaMeta: ns("schemaMeta"),
  snapshotPreImport: ns("snapshot:pre-import"),
  snapshotPreClear: ns("snapshot:pre-clear"),
} as const;

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];
