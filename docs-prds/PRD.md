# CAL-EXPENSES — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Draft for engineering / design / QA review
**Companion documents:** `TRD.md` (technical architecture), `design.md` (visual design system)
**Tagline:** "Your money. Your days. One calendar."

---

## 1. Executive Summary

CAL-EXPENSES is a calendar-first personal finance and life-planning web application. It unifies expense tracking, income tracking, budgeting, savings goals, event planning, gift planning, and lightweight family organization inside a single interactive calendar, augmented by an AI assistant that can read and act on the user's financial data through natural language.

V1 ships as a client-heavy single-page web app (installable as a PWA) using **Firebase Authentication only** for identity and **browser `localStorage` only** for application data, behind a storage abstraction that allows a cloud-sync backend to be introduced later without a rewrite. V1 deliberately does not implement real-time multi-device sync, real-time family collaboration, or any backend financial database — these are explicitly out of scope and are called out wherever a reader might otherwise assume they exist.

## 2. Product Vision

Most finance apps are ledgers. Most calendars ignore money entirely. CAL-EXPENSES treats every day as a unit that carries both a schedule and a financial state, so a user can answer "what happened with my money today, this week, this month" without leaving the view they already use to plan their life. Life events (birthdays, trips, festivals) and financial events (bills, budgets, gifts) are treated as the same kind of object on the same timeline.

## 3. Problem Statement

- Expense trackers show transactions in flat lists disconnected from *when* and *why* the money moved (an event, a bill, a trip).
- Calendars show events and reminders but nothing about their financial footprint (a birthday shows a party, not a gift budget).
- Budgeting tools are usually monthly and category-only; they don't tie spend to specific plans (a trip, a gift, a family occasion).
- Most "AI-powered" finance tools bolt on a chatbot that summarizes data but can't reliably take structured action, or worse, silently mutates data without confirmation.
- Users who want a private, local-first tool are forced into cloud-only products that require an account with a hosted database, increasing both cost and privacy exposure.

## 4. Goals

- G1: Make daily/weekly/monthly financial activity visible at a glance inside a calendar.
- G2: Let users plan and track money against real-life occasions (events, gifts, trips), not just abstract categories.
- G3: Provide budgets and goals with unambiguous, auditable calculations.
- G4: Offer an AI assistant that performs real, structured, confirmed actions — not just narration.
- G5: Keep V1 fully client-side and privacy-respecting: no third-party database holds the user's financial data.
- G6: Build the storage and domain layers so a future cloud-sync backend is additive, not a rewrite.
- G7: Ship a product that is accessible (WCAG-aligned), responsive, and installable offline (PWA).

## 5. Non-Goals (V1)

- NG1: No real-time multi-device sync. Data lives in one browser's `localStorage`.
- NG2: No real-time multi-user collaboration (family "sharing" in V1 is same-device profiles plus export/import packages, not live collaboration).
- NG3: No bank account linking, no Plaid/OAuth financial aggregation, no automatic transaction import from banks.
- NG4: No payments, monetization, subscriptions, or in-app purchases.
- NG5: No investment tracking, tax filing, or credit-score features.
- NG6: No gambling-style mechanics anywhere, including in the educational games.
- NG7: AI Assistant does not give licensed financial, tax, or legal advice, and does not autonomously move money (there is no money to move — it only writes local records).
- NG8: No server-side database of financial records (Firestore/RTDB/Storage explicitly excluded per architecture mandate).

## 6. Key Assumptions & Resolved Conflicts

The source brief leaves some points ambiguous or in tension. The following decisions resolve them and are binding on `TRD.md` and `design.md`.

| # | Tension | Resolution |
|---|---|---|
| A-1 | AI Assistant needs to call an LLM, but no backend/database is specified. | V1 adds exactly one minimal, **stateless** serverless function (e.g., a single Cloud Function or edge function) that proxies AI requests so the AI provider's API key is never shipped to the client. This function stores nothing — it is compute only, not a database, so it does not violate the "no Firestore/RTDB/Storage" constraint. If no backend is permitted at all, the fallback is a user-supplied API key stored locally (opt-in, clearly labeled as leaving the device only for that call) — see `TRD.md` §9. |
| A-2 | "Family" implies shared data; storage is localStorage (single browser). | V1 family features are explicitly **local-only**: family member profiles are records inside the primary account holder's local data, used for planning/tagging (e.g., "gift for Dad"), not for multi-login collaboration. Sharing across people happens via exported PDF/CSV/JSON packages, never live sync. |
| A-3 | Recurring transactions could auto-create financial records without explicit user action, which conflicts with "AI must never invent financial records." | The same principle is extended to all automation: recurring transactions default to **manual confirmation** (`autoCreate = false`). Users may opt a specific recurring item into `autoCreate = true`, in which case the system still sends a non-blocking notification immediately after creation — never silent. |
| A-4 | No currency/locale strategy specified; examples use ₹ (INR). | V1 supports **one currency per user profile** (default INR), selectable from a supported list, with locale-aware number formatting (including Indian digit grouping when locale is `en-IN`). No multi-currency mixing or FX conversion in V1; this is a documented V2 candidate. |
| A-5 | Import "must never silently overwrite" but must also support restoring a full backup. | Import always opens a **diff/preview step** showing additions, updates, and conflicts before anything is written, with an explicit choice of Merge or Replace-All, and a mandatory pre-import automatic snapshot the user can undo from. |
| A-6 | Frontend framework not specified. | React 18 + TypeScript + Vite (see `TRD.md` §2 for rationale). |
| A-7 | Whether budgets "roll over" surplus, deficit, or both. | Rollover is **off by default** per budget. When enabled, both surplus and deficit roll into the next period unless the user selects "surplus only" in advanced budget settings. |
| A-8 | Whether a starting/opening balance exists. | V1 adds an optional **Starting Balance** field (Profile → Financial Preferences, default 0) so "Current Balance" is meaningful for users who set it; if unset, balance is purely the sum of logged income minus expenses. |
| A-9 | Duplicate expense prevention: block vs warn. | The system **warns, never silently blocks**: an expense with the same amount + category within a 5-minute window of an existing entry triggers a "Possible duplicate — add anyway?" confirmation. |
| A-10 | Whether AI can act without any confirmation. | Read-only queries ("show me what I spent this week") execute immediately. Any write action (create/update/delete) shows a structured preview card the user must explicitly confirm, except for the single low-risk case of creating a *new* record with no ambiguity (e.g., "spent ₹250 on lunch today") where V1 uses an inline, immediately-undoable "Added — Undo" toast instead of a blocking modal; destructive or bulk actions always block on confirmation (see §11.16, AI Safety). |

## 7. Target Users & Personas

### 7.1 Individual User — "Everyday Tracker"
- **Goals:** Know where money goes without spreadsheets; catch overspending early.
- **Frustrations:** Existing apps feel like accounting software; entering an expense takes too many taps.
- **Behaviors:** Logs expenses same-day, checks balance a few times a week.
- **Key features:** Fast add-expense flow, dashboard balance, category breakdown.
- **Accessibility:** Standard; values a clean, low-clutter UI on mobile.

### 7.2 Student / Young Adult — "Budget Beginner"
- **Goals:** Stretch a fixed monthly allowance; build a savings habit.
- **Frustrations:** Budgeting apps assume salaried income and recurring bills they don't have.
- **Behaviors:** Irregular income (allowance, part-time gigs), price-sensitive, mobile-only.
- **Key features:** Simple category budgets, savings goals (e.g., "New Laptop"), gamified challenges.
- **Accessibility:** Small-screen touch targets, offline usage on patchy data.

### 7.3 Working Professional — "Time-Poor Planner"
- **Goals:** Automate the boring parts; get insights, not busywork.
- **Frustrations:** No time to categorize every transaction manually.
- **Behaviors:** Wants AI natural-language entry ("spent 250 on lunch"), recurring bills, monthly reports.
- **Key features:** AI Assistant, recurring transactions, PDF monthly report export, analytics trends.
- **Accessibility:** Desktop + mobile parity; keyboard shortcuts valued.

### 7.4 Family Organizer — "Household Coordinator"
- **Goals:** Track shared occasions (birthdays, festivals, school events) and their budgets/gifts.
- **Frustrations:** Money for events is scattered across memory, chat threads, and receipts.
- **Behaviors:** Plans months ahead for birthdays/festivals; tracks gift budgets per family member.
- **Key features:** Events with linked gifts and budgets, Family module, event/gift reminders, exportable event summaries.
- **Accessibility:** Larger text options for reading budgets at a glance; clear color-independent status.

### 7.5 Privacy-Conscious User — "Local-First Advocate"
- **Goals:** Full control of financial data; no data leaving the device unnecessarily.
- **Frustrations:** Most finance apps require a cloud account and quietly sync everything.
- **Behaviors:** Reviews privacy settings before using a feature; exports backups manually.
- **Key features:** Explicit "local data only" messaging, clear AI proxy disclosure, full local data export/delete, ability to disable AI Assistant entirely.
- **Accessibility:** Wants explicit, non-dark-pattern consent language and visible data controls.

## 8. User Journeys (illustrative)

**J1 — First expense in under a minute.** Sign up with Google → 3-step onboarding (currency, starting balance, first budget) → land on Dashboard → tap central Add → Expense → amount, category, done → toast confirms → calendar dot appears on today.

**J2 — Birthday with a gift budget.** Create Event "Mom's Birthday" on a date → set Event Budget ₹3,000 → add planned Gift (recipient: Mom, budget ₹1,500) → buy the gift, mark purchased with actual cost → Event view shows planned vs actual and remaining budget → Calendar shows a gift indicator on that date.

**J3 — AI natural-language logging.** User types "spent 250 on lunch today" in the AI Assistant → AI detects intent `create_expense`, extracts amount/category/date → shows an inline preview ("Add ₹250 expense, Food, today") → user confirms (or it auto-adds with an Undo toast per A-10) → Expense is created → Dashboard and Calendar update.

**J4 — Monthly review via calendar heatmap.** User opens Calendar → switches to Analytics-linked heatmap view → sees darker days = higher spend → taps a heavy day → Day view lists transactions → user notices a duplicate → deletes it with confirmation.

**J5 — Backup before switching devices.** Settings → Privacy → Export → chooses JSON (full backup) → downloads file → on new device, signs in → Import → previews diff → chooses Replace-All → confirms → data restored.

## 9. MVP / V1 / V2 Boundaries

- **MVP (internal alpha):** Auth, Onboarding, Dashboard, Calendar (month/day), Expenses, Income, Categories, basic Budgets, Settings, local export (JSON).
- **V1 (this PRD's scope, public release):** Everything in MVP plus Calendar week/agenda views, Goals, Recurring Transactions, Events, Gifts, local Family, Analytics, AI Assistant + Insights + Automation, Search, Notifications, full Export/Import (PDF/CSV/JSON), Sharing packages, PWA/offline, educational games.
- **V2 (future, not specified here):** Optional cloud sync provider behind the existing `StorageProvider` abstraction, true multi-user family collaboration, bank/institution linking, multi-currency with FX, monetization tiers (Free/Pro/Family).

## 10. Non-Functional Requirements (NFR)

| ID | Requirement |
|---|---|
| NFR-001 | First contentful paint on a mid-range mobile device (4G) under 2.5s for the Dashboard route. |
| NFR-002 | Calendar month view renders and remains interactive (input latency < 100ms) with up to 5,000 transactions in local storage. |
| NFR-003 | All write operations to storage are atomic per key: a failed write must not leave partial/corrupt JSON in that key. |
| NFR-004 | App must function fully offline after first load (PWA), including add/edit/delete of all entity types; AI Assistant degrades gracefully offline (see NFR-014). |
| NFR-005 | No financial data is transmitted to any server except the minimal AI proxy call described in A-1, and only the specific text/context needed for that AI request — never a bulk data dump. |
| NFR-006 | Firebase Auth tokens are never persisted to `localStorage` in raw form; only the SDK's own secure session mechanism is used. |
| NFR-007 | All user-supplied text (merchant, notes, descriptions, event/gift fields) is sanitized before rendering to prevent XSS; no `dangerouslySetInnerHTML` with unsanitized input. |
| NFR-008 | AI Assistant treats all user and stored text as data, never as instructions to change system behavior (prompt-injection resistance) — see `TRD.md` §9.4. |
| NFR-009 | Destructive actions (delete transaction/budget/goal/event, bulk delete, clear all data, replace-import) require an explicit confirmation step; none are reachable via a single accidental tap. |
| NFR-010 | Application meets WCAG 2.1 AA for color contrast, keyboard operability, and screen-reader labeling on all primary flows (see `design.md` §Accessibility). |
| NFR-011 | Responsive layouts are defined (not just scaled) for mobile (≤480px), tablet (481–1024px), laptop (1025–1440px), desktop (>1440px). |
| NFR-012 | Calendar, expense list, and analytics views use windowing/virtualization once item counts exceed ~200 in a single view. |
| NFR-013 | PDF export of a 12-month report generates client-side in under 5 seconds on a mid-range device. |
| NFR-014 | If the AI proxy is unreachable, the AI Assistant surfaces a clear "AI unavailable — offline or service down" state and all non-AI features continue to work normally. |
| NFR-015 | `localStorage` usage is monitored against a soft budget (see `TRD.md` §6.5); the app warns the user before hitting the browser storage quota rather than failing silently. |
| NFR-016 | Schema-versioned storage: every stored key includes a version segment (e.g., `calexpenses:v1:expenses`) and a migration path is defined for version bumps (see `TRD.md` §6.4). |
| NFR-017 | The app is installable as a PWA (manifest + service worker) on Android, iOS (via Add to Home Screen), and desktop Chromium browsers. |
| NFR-018 | Automated test coverage: domain/calculation layer ≥ 90% line coverage; critical user flows (see PRD §16 Testing scope in TRD) covered by E2E tests. |
| NFR-019 | No secrets (API keys, credentials) are ever written to `localStorage`, source control, or client bundles in plaintext. |
| NFR-020 | Public marketing pages (landing, auth) are indexable; authenticated app routes are excluded from indexing via `robots` meta and `noindex` headers. |
| NFR-021 | The app supports `prefers-reduced-motion` and disables non-essential animation when set. |
| NFR-022 | Currency and date formatting respect the user's selected locale/currency/date-format/first-day-of-week settings consistently across every screen. |
| NFR-023 | Error states never expose raw stack traces or storage keys to end users; a correlation ID may be shown for support purposes. |

## 11. Feature Requirements

Numbering is sequential across the document (`FR-XXX`). Acceptance criteria are given for primary/high-complexity features; secondary features have concise, testable requirement statements.

### 11.1 Authentication
- **FR-001** Users may sign up/sign in via Google OAuth (Firebase Auth) or email/password.
- **FR-002** Email/password sign-up requires a valid email format and a password ≥ 8 characters with at least one letter and one number; validation errors are inline and specific.
- **FR-003** Users may request a password reset email for email/password accounts (Firebase Auth reset flow).
- **FR-004** Session state persists across browser restarts using Firebase Auth's own persistence; the app never stores raw tokens itself (see NFR-006).
- **FR-005** Sign out clears the Firebase session and returns to the landing/auth screen; it does **not** delete local application data.
- **FR-006** An expired/invalid session redirects to sign-in with a non-alarming "Please sign in again" message, never a raw error.

**Acceptance criteria (Authentication):**
- Given a new user with a valid email and strong password, when they submit sign-up, then an account is created and they land on Onboarding step 1.
- Given an existing Google user, when they choose "Continue with Google," then they land on Dashboard (or Onboarding if first login) without re-entering a password.
- Given a signed-in user with corrupted or missing local data, when they load the app, then Authentication succeeds independently and the app shows the Empty state for each feature rather than failing to load.

### 11.2 Onboarding
- **FR-007** First-time users complete a 3–4 step onboarding: currency + locale, optional starting balance, first budget (optional, skippable), and AI Assistant opt-in.
- **FR-008** Onboarding is skippable at every step except account creation; sensible defaults apply (INR, no starting balance, AI enabled with confirmation-required mode).
- **FR-009** Onboarding never asks for information not used elsewhere in the product.
- **FR-010** Re-running onboarding is available from Settings ("Redo setup") without affecting existing data.

### 11.3 Profile
- **FR-011** Profile displays avatar (from Firebase Auth provider or initials fallback), display name, email, and auth provider (read-only for Google-sourced fields).
- **FR-012** Users may edit display name locally (does not modify the Firebase Auth profile unless explicitly synced).
- **FR-013** Preferences: currency, language, date format, timezone, first day of week, theme (light/dark/system) — all changes apply immediately app-wide.
- **FR-014** Financial preferences: default category, default payment method, default budget period, starting balance.
- **FR-015** AI preferences: AI enabled/disabled, confirmation preference (always-confirm vs quick-add-with-undo per A-10), insight frequency (daily/weekly/off).
- **FR-016** Privacy actions accessible from Profile: export data, import data, clear local data, delete account (see §11.25).

### 11.4 Dashboard
- **FR-017** Dashboard shows: Current Balance, Monthly Income, Monthly Expenses, Monthly Savings, Savings Rate, Budget Utilization (overall), Upcoming Bills, Upcoming Events, Recent Transactions (last 5), a 7-day Spending Trend, Category Breakdown (current month), a Calendar preview (current week), and AI Insights (top 2–3).
- **FR-018** All calculations use the formulas defined below; no dashboard figure may be derived by any other method.

**Dashboard calculation rules (binding):**
```
CurrentBalance      = StartingBalance + Σ(Income.amount, date ≤ today) − Σ(Expense.amount, date ≤ today)
MonthlyIncome        = Σ(Income.amount) where date ∈ [monthStart, monthEnd] (user's local timezone)
MonthlyExpenses       = Σ(Expense.amount) where date ∈ [monthStart, monthEnd]
MonthlySavings        = MonthlyIncome − MonthlyExpenses            // may be negative
SavingsRate%         = MonthlySavings / MonthlyIncome × 100         // "—" if MonthlyIncome = 0
CategoryUtilization%  = Σ(Expense.amount, category=X, in period) / Budget(X).amount × 100
OverallUtilization%   = Σ(spent across budgeted categories) / Σ(budgeted amount across those categories) × 100
                         // categories without a budget are excluded from this ratio and shown as "Unbudgeted spend: ₹Y"
SpendingTrend%        = (currentPeriodSum − previousPeriodSum) / previousPeriodSum × 100
                         // "New" if previous = 0 and current > 0; "—" if both are 0
UpcomingBills          = RecurringTransaction[type=expense, status=active] where nextOccurrenceDate ∈ [today, today+N days] (N default 7, user-configurable)
UpcomingEvents          = Event where date ∈ [today, today+M days], sorted ascending (M default 14, user-configurable)
GoalProgress%          = min(Goal.currentAmount / Goal.targetAmount × 100, 100) for display; underlying ratio uncapped for "overfunded" state
```

**Acceptance criteria (Dashboard):**
- Given a user with no starting balance set, when Dashboard loads, then Current Balance equals total income minus total expenses to date, with no error.
- Given MonthlyIncome = 0, when Dashboard computes Savings Rate, then it displays "—" rather than a divide-by-zero error or blank.
- Given a category with no budget defined, when Overall Budget Utilization is computed, then that category's spend is excluded from the ratio and surfaced separately as unbudgeted spend.
- **FR-019** Dashboard figures update immediately (no manual refresh) after any add/edit/delete of Expense, Income, Budget, or Goal.
- **FR-020** Recent Transactions list supports tapping through to the full transaction detail.
- **FR-021** Category Breakdown is a sorted (descending) list/chart with percentage-of-total labels.
- **FR-022** Calendar preview shows the current week with per-day compact indicators (see §11.5).
- **FR-023** Empty Dashboard (new user, no data) shows contextual empty states per widget, not a blank screen.
- **FR-024** Dashboard is keyboard-navigable and each stat card has an accessible label announcing the value and its meaning (e.g., "Current balance: ₹4,200").

### 11.5 Calendar (primary product feature)
- **FR-025** Calendar supports Month, Week, Day, and Agenda views, switchable via a persistent control.
- **FR-026** Each date cell shows compact indicators for: Income present, Expense present, Bill due, Event, Gift, Goal deadline, Reminder — using shape/icon + color, never color alone (NFR accessibility).
- **FR-027** Month view date cells show a compact financial summary when space allows (Spent total, Income total) and always show indicator dots; Week/Day views show fuller detail (see FR-030).
- **FR-028** Tapping/clicking a date opens a Day Detail view listing: total spent, total income, events, transactions (each with category, amount, merchant), gifts due, and reminders for that date.
- **FR-029** Recurring events/bills appear on every computed occurrence date without duplicating underlying data (the occurrence is computed, not stored per date — see `TRD.md` §7).
- **FR-030** Users can filter the calendar by type (Income/Expense/Bill/Event/Gift/Goal/Reminder) and by category; filters persist per session.
- **FR-031** All dates are handled in the user's selected timezone (default: browser timezone at first launch, changeable in Settings); a transaction's "date" is a calendar date, not a timestamp, and is timezone-stable (does not shift when the user's timezone setting changes after the fact).
- **FR-032** Calendar interaction states: default, hover/focus (desktop), today (visually distinct), selected, has-data, empty, disabled (out-of-range navigation), and drag-select for multi-day filtering (desktop only).
- **FR-033** On mobile, Month view uses a compact grid with tap-to-expand Day Detail as a bottom sheet; Week/Agenda are the recommended default mobile views for information density.
- **FR-034** Calendar navigation (prev/next month, jump-to-today, jump-to-date) is available via UI controls and keyboard shortcuts (desktop).

**Acceptance criteria (Calendar):**
- Given a monthly recurring bill due on the 5th, when the user views any month, then a Bill indicator appears on the 5th of every month from the recurrence's start date through its end date (or indefinitely if no end date), without a separate stored record per month.
- Given a user changes their timezone in Settings, when they reload the Calendar, then previously logged transaction dates remain on the same calendar day they were entered on.
- Given the user filters by "Expense" only, when viewing Month view, then Income/Event/Gift indicators are hidden and only Expense indicators remain, and the filter persists on navigating to next month.

### 11.6 Expenses
- **FR-035** Expense fields: id, amount, currency, category, subcategory (optional), date, time (optional), merchant (optional), description (optional), payment method, tags (optional, multi), notes (optional), recurring flag/link, event association (optional), gift association (optional), createdAt, updatedAt.
- **FR-036** Amount must be a positive number greater than 0, up to 2 decimal places (or the currency's defined decimal precision).
- **FR-037** Date defaults to today and cannot be more than 1 year in the future (configurable ceiling) to reduce entry error; past-dated entry is unrestricted.
- **FR-038** Category is required; if omitted at entry, the Profile default category is applied.
- **FR-039** Editing an expense updates `updatedAt` and immediately recalculates all dependent figures (balance, budgets, analytics, calendar indicators, AI insights).
- **FR-040** Deleting an expense requires confirmation and is immediately reflected everywhere; deletion is not soft (no "trash") in V1, but a snapshot exists for Undo within the same session (toast, 8-second window).
- **FR-041** Duplicate-entry protection: a new expense matching amount + category within a 5-minute window of an existing expense triggers a non-blocking "possible duplicate" confirmation (A-9); the user may proceed or cancel.
- **FR-042** Expenses linked to an Event or Gift display that association and roll up into that Event's/Gift's actual-cost totals.
- **FR-043** Expenses affect: Current Balance (immediately), the relevant category Budget's spent total, Analytics aggregates, Calendar indicators for that date, and become eligible input for AI Insights on next computation.
- **FR-044** Bulk-select and bulk-delete of expenses (e.g., from a list view) requires an explicit confirmation naming the count of items to be deleted.

### 11.7 Income
- **FR-045** Income fields mirror Expense (id, amount, currency, source/category, date, description, notes, recurring link, createdAt, updatedAt), with `source` in place of `category`.
- **FR-046** Supported income source types: Salary, Allowance, Freelance, Gift Income, Refund, Other (extensible list).
- **FR-047** Income entries are included in Current Balance, Monthly Income, Savings Rate, and Analytics identically to how Expenses are included on the debit side.
- **FR-048** A Refund may optionally reference the original Expense it offsets, for traceability, without automatically altering the original Expense record.
- **FR-049** Editing/deleting Income follows the same confirmation and recalculation rules as Expenses (FR-039, FR-040).

### 11.8 Categories
- **FR-050** Category fields: id, name, icon, color, type (income/expense/both), isSystem (seeded default) vs isCustom, optional parentId for a single level of subcategory.
- **FR-051** A seeded default category set is provided on account creation (e.g., Food, Transport, Shopping, Bills, Entertainment, Health, Education, Gifts, Other; Income defaults: Salary, Allowance, Freelance, Gift, Refund, Other).
- **FR-052** Users may create, rename, recolor, and re-icon custom categories; system categories may be renamed/recolored but not deleted if in use (deletion is blocked with a message pointing to reassignment).
- **FR-053** Deleting a custom category that is in use prompts the user to reassign existing transactions to another category before deletion completes (never silently orphaned).
- **FR-054** Category list is searchable/filterable in the picker UI once it exceeds ~10 items.

### 11.9 Budgets
- **FR-055** Budget types: monthly (category), event budget, family budget, and custom date-range budget.
- **FR-056** Budget fields: id, name, scope (category/event/family/custom), category (if applicable), amount, period (start/end or recurring monthly), rollover (boolean, default false; mode: both | surplus-only), alertThresholds (default [80, 100]), createdAt, updatedAt.
- **FR-057** Budget utilization is computed per the formula in §11.4 (CategoryUtilization%); display is capped visually at 100% with an explicit "over by ₹X" state beyond that.
- **FR-058** Rollover, when enabled, computes at period boundary: `nextPeriodBudget = baseAmount + (previousPeriod.amount − previousPeriod.spent)`, clamped per the surplus-only setting (deficits ignored, i.e., treated as 0, when surplus-only is selected).
- **FR-059** Crossing an alert threshold (default 80%, 100%) triggers a Notification and is eligible for an AI Insight; thresholds are configurable per budget.
- **FR-060** Overspending (>100%) is visually flagged (not blocked) — CAL-EXPENSES never prevents a user from recording a real expense.
- **FR-061** Event budgets aggregate all Expenses/Gifts linked to that Event, independent of category.
- **FR-062** Family budgets aggregate across selected local Family Member tags within a period.
- **FR-063** AI recommendations for budgets are presented as suggestions requiring explicit user acceptance to change any Budget record (see §11.16).

**Acceptance criteria (Budgets):**
- Given a Food budget of ₹4,000/month with ₹3,200 spent, when the user views Budgets, then Remaining shows ₹800 and utilization shows 80%, triggering the default alert threshold.
- Given rollover enabled in "both" mode and a ₹500 surplus in the prior period, when the new period starts, then the new period's effective budget is base amount + ₹500.
- Given a budget scoped to an Event, when an Expense is linked to that Event, then the Event budget's spent total updates without requiring the Expense to also carry a matching category.

### 11.10 Goals
- **FR-064** Goal fields: id, title, targetAmount, currentAmount, deadline (optional), createdAt, updatedAt, status (active/achieved/abandoned/overdue).
- **FR-065** Contributions are individual ledger entries (id, goalId, amount, date, note, optional linked Income id) summed to produce `currentAmount`; `currentAmount` is never directly overwritten except via contributions or explicit correction with an audit note.
- **FR-066** GoalProgress% is computed per §11.4; reaching ≥100% sets status to `achieved` and surfaces a celebratory but non-intrusive confirmation.
- **FR-067** A Goal past its deadline with `currentAmount < targetAmount` is flagged `overdue` (visual only; still editable/contributable).
- **FR-068** Goal history shows a chronological list of contributions.
- **FR-069** Users may edit target amount or deadline at any time; changes are timestamped, not silently overwritten.
- **FR-070** Deleting a Goal requires confirmation and does not delete any linked Income/Expense records, only the Goal and its contribution ledger.

### 11.11 Recurring Transactions
- **FR-071** Fields: id, type (income/expense), amount, category/source, startDate, frequency (daily/weekly/biweekly/monthly/yearly/custom-interval-days), endDate or occurrenceCount (optional), nextOccurrenceDate (computed), lastGeneratedDate, status (active/paused/ended), autoCreate (default false), reminderDaysBefore (default 3).
- **FR-072** When `autoCreate = false` (default), the recurring item generates a Reminder on `nextOccurrenceDate − reminderDaysBefore`; the user confirms to create the actual Expense/Income record (A-3).
- **FR-073** When `autoCreate = true`, the system creates the actual record on `nextOccurrenceDate` and immediately shows a non-blocking notification (never silent).
- **FR-074** Pausing a recurring transaction stops future generation without deleting history; resuming recalculates `nextOccurrenceDate` from today forward.
- **FR-075** Editing frequency/amount applies to future occurrences only; past-generated records are never retroactively altered.
- **FR-076** Recurring items feed the Calendar's "Bill" indicator (§11.5) and the Dashboard's Upcoming Bills widget.

### 11.12 Events
- **FR-077** Event fields: id, title, date, time (optional), location (optional), notes (optional), linked people (Family Member ids or free-text names), budget (optional), plannedExpenses (list, optional), actualExpenses (computed from linked Expense records), linked gifts, reminders, createdAt, updatedAt.
- **FR-078** Event categories/templates include Birthday, Trip, Wedding, Festival, School Event, Family Event, Shopping Event, Other.
- **FR-079** An Event's "actual cost" is always computed as the live sum of Expense records with `eventAssociation = event.id`, plus the actual cost of any linked Gifts — never manually entered as a separate number.
- **FR-080** Planned expenses are a lightweight itemized estimate list (label + estimated amount) distinct from actual linked Expense records, allowing planned-vs-actual comparison.
- **FR-081** Event budget remaining = `event.budget − (Σ linked actual Expenses + Σ linked Gift actualCost)`.
- **FR-082** Multi-day Events (e.g., a Trip) span a date range and appear on every date in range in Calendar views, with the detail view showing which specific date within the trip is selected.
- **FR-083** Deleting an Event prompts the user to choose whether linked Expenses/Gifts are also deleted or merely unlinked (default: unlinked, preserving the financial record).
- **FR-084** Event reminders follow the same Notification system as recurring bills (§11.20).

### 11.13 Gift Planner
- **FR-085** Gift fields: id, recipient, occasion, date, budget, plannedGift (description), purchasedStatus (planned/purchased), actualCost, notes, reminder, optional linked Event id, optional linked Expense id (once purchased), createdAt, updatedAt.
- **FR-086** Marking a gift "purchased" prompts for actual cost and optionally creates/links an Expense record (category defaults to "Gifts"); this creation always requires explicit confirmation and is never performed by AI without the user's action.
- **FR-087** Gift budget remaining = `budget − actualCost` (0 while status is `planned`, since no actual cost is yet known).
- **FR-088** AI may help organize gift planning (suggest ideas, draft a list, remind about dates) but AI must never mark a gift as purchased, set an actual cost, or claim a purchase occurred — those are user-only actions (explicit constraint from source brief).
- **FR-089** Gifts linked to an Event roll into that Event's actual cost (FR-079).
- **FR-090** Upcoming gift-relevant occasions (birthdays, etc.) surface in Dashboard's Upcoming Events and trigger reminders per `reminderDaysBefore`.

### 11.14 Family (local-only in V1)
- **FR-091** Family Member fields: id, name, relationship (optional), avatar/color, notes, birthday (optional) — stored entirely in the local account holder's data.
- **FR-092** Family Members can be tagged on Events, Gifts, and Family-scoped Budgets for organization and roll-up totals; this is local metadata, not a separate login.
- **FR-093** The UI explicitly labels Family data as "stored only on this device" wherever it is displayed or edited, to prevent the misconception that other family members can see or edit it live.
- **FR-094** Family budgets aggregate spend across tagged Family Members within a period (§11.9 FR-062).
- **FR-095** Sharing Family/Event data with actual family members is done via export (PDF/CSV summary) or a generated shareable text/JSON package — never a live link with write access (V1 constraint; true collaboration is V2, see §9).
- **FR-096** A birthday set on a Family Member automatically proposes (not silently creates) a recurring yearly Event/reminder, which the user must confirm to add.

### 11.15 Analytics
- **FR-097** Analytics provides Daily, Weekly, Monthly, and Yearly spending views, Category Analysis, Income vs. Expense comparison, Savings Rate over time, Budget Utilization over time, Spending Trends, a Calendar Heatmap (spend intensity per day), Event Spending, and Goal Progress summaries.
- **FR-098** All analytics figures are derived exclusively from locally stored Expense/Income/Budget/Goal/Event records via the shared calculation engine (§11.4 formulas plus the extended formulas in `TRD.md` §11) — analytics never uses separately maintained numbers.
- **FR-099** Calendar Heatmap buckets days into 5 intensity levels based on that day's total spend relative to the user's trailing-90-day daily average (level thresholds: ≤25%, 25–75%, 75–125%, 125–200%, >200% of average), and is colorblind-safe (pattern + color).
- **FR-100** Category Analysis supports drill-down: category → subcategory/transactions for the selected period.
- **FR-101** Savings Rate over time is a monthly time series using the SavingsRate% formula per historical month.
- **FR-102** Event Spending analytics lists all Events in a period with planned vs. actual, sorted by variance (over-budget first).
- **FR-103** Analytics views support exporting the current view as PDF/CSV (see §11.21).

### 11.16 AI Assistant
- **FR-104** The AI Assistant accepts natural-language input (text; voice input is a supported client capability where the browser provides it, transcribed to text before processing) and returns either an answer (read query) or a proposed structured action (write operation).
- **FR-105** The AI pipeline is: natural language → intent detection → structured command (typed, schema-validated) → validation against current data → confirmation (where required per A-10) → storage operation via the domain layer (never direct storage access) → result → user-facing feedback in plain language.
- **FR-106** Supported intent categories (V1): create_expense, create_income, query_spending (by period/category), create_event, create_budget, create_goal, query_budget_status, query_upcoming (bills/events), create_reminder, general_help. Unsupported/ambiguous input yields a clarifying question, never a guessed action.
- **FR-107** Every AI-proposed write action is shown as a structured preview (what will be created/changed) before or immediately after execution per the confirmation rules in A-10; the user can edit fields in the preview before confirming.
- **FR-108** The AI Assistant maintains a visible conversation/action history the user can scroll back through and undo recent AI-initiated actions from.
- **FR-109** The AI Assistant clearly labels every output as one of **Fact** (a number pulled directly from stored data), **Estimate** (a projection/aggregation), or **Suggestion** (an opinionated recommendation) — this labeling is a UI requirement, not just a prompt instruction (see `design.md` AI UI patterns).
- **FR-110** AI budgeting/spending guidance is presented as organizational guidance with a persistent, non-dismissible-per-session disclaimer that it is not professional financial advice.
- **FR-111** Users can fully disable the AI Assistant in Settings; when disabled, no data leaves the device for AI purposes and all AI entry points are hidden, not just grayed out.

**AI Safety / Confirmation rules (binding on all AI actions):**
- Deleting transactions, budgets, or goals via AI always requires explicit confirmation naming exactly what will be deleted.
- Bulk modifications proposed by AI (e.g., "recategorize all my coffee purchases") always require confirmation showing the count and a sample of affected records.
- Clearing data or import-replace actions are never reachable through the AI Assistant at all in V1 — those remain manual-only flows in Settings, to keep the highest-risk actions outside natural-language ambiguity.
- The AI never fabricates a financial record, balance, or statistic; if data is insufficient to answer, it says so rather than estimating silently.

**Acceptance criteria (AI Assistant):**
- Given the input "spent 250 on lunch today," when processed, then the AI proposes a Food-category Expense of ₹250 dated today, shown as an inline confirmable preview per A-10.
- Given the input "delete all my transactions from July," when processed, then the AI shows a blocking confirmation stating the exact count of records to be deleted before any deletion occurs.
- Given the AI cannot confidently map input to a supported intent, when processed, then it asks a clarifying question rather than guessing.

### 11.17 AI Insights
- **FR-112** Insights are generated by a deterministic **Calculation Engine** (pure functions over stored data) and then optionally narrated in natural language by the AI layer; the numeric content of an insight must be traceable to a calculation-engine function, never generated by the language model itself (see `TRD.md` §9.2 for the separation).
- **FR-113** Example insight types: category spend vs. previous period, budget threshold crossed, upcoming planned-expense total, goal progress milestones, unusual single-transaction size relative to category history.
- **FR-114** Insight frequency is user-configurable (daily/weekly/off) per FR-015.
- **FR-115** Every insight links back to the underlying data view (e.g., tapping "food spending is up 20%" opens Category Analysis filtered to Food).
- **FR-116** No insight may state a figure it cannot support from stored records; when confidence is low (e.g., too little history), the insight is withheld rather than shown as speculative fact.

### 11.18 AI Automation
- **FR-117** Automations are user-visible rules of the form **Trigger → Condition(s) → Action**, built from a fixed, non-arbitrary catalog (no free-form code execution).
- **FR-118** Trigger catalog (V1): expense created (with amount threshold), budget utilization reaches X%, event/gift/bill due within N days, goal progress reaches X%.
- **FR-119** Action catalog (V1): show notification, generate AI insight, create reminder. Creating or modifying financial records is explicitly **not** an available automation action in V1 (only recurring transactions, a distinct system with its own confirmation rules per §11.11, may create records).
- **FR-120** Each automation has enable/disable, an execution history (what fired, when, with what result), and a failure state (e.g., malformed condition) that disables it with a visible reason rather than failing silently.
- **FR-121** Automations run entirely client-side against local data on app load and on relevant data changes; there is no server-side scheduler in V1 (a closed app does not fire time-based automations until reopened — documented limitation, see `TRD.md` §10.5).
- **FR-122** Users may create, edit, duplicate, and delete automations from a dedicated Automations screen; deleting requires confirmation.
- **FR-123** The permission model restricts automation actions to the fixed catalog in FR-119 — there is no mechanism for an automation (or the AI) to invoke arbitrary app functions.

### 11.19 Search
- **FR-124** Global search covers Expenses, Income, Events, Gifts, Goals, and Budgets by text match on name/title/merchant/notes/tags.
- **FR-125** Search supports basic filters: date range, category, amount range, type.
- **FR-126** Results are grouped by entity type with the matched field highlighted.
- **FR-127** Empty search results show a helpful empty state, not a blank screen (e.g., "No matches — try a different date range").

### 11.20 Notifications / Reminders
- **FR-128** Reminder sources: recurring transactions (FR-072), Event reminders (FR-084), Gift reminders (FR-085), budget threshold alerts (FR-059), goal milestones.
- **FR-129** In-app notifications appear in a persistent notification center; browser push notifications are an optional, explicitly opt-in capability (requires the PWA to be installed and permission granted) — the app must function fully without push permission.
- **FR-130** Notifications are dismissible individually or in bulk ("mark all read"); dismissing does not delete the underlying reminder/automation record.
- **FR-131** Each notification links to the relevant record/screen.
- **FR-132** Users can mute a specific notification category (e.g., budget alerts) without disabling notifications entirely.

### 11.21 Export
- **FR-133** Supported export formats: PDF (formatted reports), CSV (tabular), JSON (complete backup).
- **FR-134** PDF export types: Monthly Report, Yearly Report, Event Summary, Budget Summary — each with a defined, consistent layout (see `TRD.md` §12 for schema).
- **FR-135** CSV export includes a header row and one row per transaction with all fields from the data model (§ Data Model in `TRD.md`), suitable for spreadsheet import.
- **FR-136** JSON export is a complete, versioned backup of all local data (`schemaVersion` field included) sufficient to fully restore state via Import.
- **FR-137** Exports never include another local account's data (single-account scope) and generate entirely client-side (no data sent to a server to produce an export).

### 11.22 Import
- **FR-138** Import accepts a CAL-EXPENSES JSON backup file and validates it against the expected schema and `schemaVersion` before any preview is shown.
- **FR-139** A corrupted, unrecognized, or incompatible-version file is rejected with a clear, specific error (e.g., "This file is from an older format we can no longer read" vs. "This file isn't a valid CAL-EXPENSES backup") — never a silent partial import.
- **FR-140** Valid files produce a **preview/diff** (counts of new, updated, and conflicting records per entity type) before any write occurs (A-5).
- **FR-141** The user chooses **Merge** (new + non-conflicting updates only, conflicts flagged for manual resolution) or **Replace All** (full overwrite, requires typed confirmation, e.g., typing "REPLACE"); an automatic pre-import snapshot is taken either way and offered as an Undo for a limited window.
- **FR-142** Import never runs automatically or silently (e.g., no auto-import on file drop without the preview step).

### 11.23 Sharing
- **FR-143** Sharing is accomplished via generated PDF, CSV, or JSON files, or a plain-text/markdown "shareable summary" (e.g., an Event or Budget summary formatted for pasting into a message).
- **FR-144** No sharing mechanism in V1 grants another person live read/write access to the user's data; every share is a point-in-time export.
- **FR-145** Shareable summaries let the user choose what's included (e.g., exclude notes/merchant detail) before generating, to avoid oversharing sensitive detail.
- **FR-146** The architecture exposes a clear extension point for a future cloud-based live-sharing feature without requiring a redesign of the sharing UI (see `TRD.md` §14).

### 11.24 Settings
- **FR-147** Settings is organized into: Profile, Preferences, Financial Defaults, AI, Notifications, Privacy & Data, About.
- **FR-148** All settings changes apply immediately without a separate "save" step, with the exception of destructive actions which always require their own confirmation.
- **FR-149** Theme (light/dark/system) switches without a page reload.
- **FR-150** Settings changes are themselves persisted to local storage under their own versioned key (`calexpenses:v1:settings`).
- **FR-151** A "Reset to defaults" action exists per settings group, itself requiring confirmation.
- **FR-152** Settings screen is fully keyboard-navigable and each control has an accessible name/description.

### 11.25 Privacy Controls
- **FR-153** Export Data, Import Data, Clear Local Data, and Delete Account are all available from Profile/Settings → Privacy.
- **FR-154** "Clear Local Data" removes all `calexpenses:v1:*` keys after a typed confirmation; it does not touch the Firebase Auth account itself.
- **FR-155** "Delete Account" clears local data **and** deletes the Firebase Auth user (via the SDK's account-deletion flow), with a clear explanation that this is irreversible and that a backup export is recommended first.
- **FR-156** A dedicated, always-accessible explanation clarifies exactly what is local-only vs. what (if anything, i.e., only the minimal AI proxy call) ever leaves the device, in plain language.
- **FR-157** The AI Assistant can be disabled entirely from Privacy settings (duplicate entry point to FR-111 for discoverability).

### 11.26 Accessibility (summary — full spec in `design.md`)
- **FR-158** Every interactive element is reachable and operable via keyboard alone, with a visible focus indicator meeting WCAG 2.1 AA contrast.
- **FR-159** All non-text indicators (calendar dots, budget status, chart series) encode meaning with shape/icon/pattern in addition to color.
- **FR-160** Charts provide an accessible data-table or text-summary alternative.
- **FR-161** Form errors are announced to assistive technology (e.g., via `aria-live`) at the moment they occur, not only visually.

### 11.27 PWA / Offline
- **FR-162** The app is installable (manifest.json, service worker) and works fully offline for all non-AI features after first successful load.
- **FR-163** An offline indicator appears when the network is unavailable; queued actions (if any require network, i.e., AI calls) are clearly marked as pending/failed rather than silently dropped.
- **FR-164** App-shell assets are cached with a cache-first strategy; data (`localStorage`) is inherently local and requires no network caching strategy.
- **FR-165** Service worker updates prompt the user to reload for a new version rather than silently swapping code under an open session.
- **FR-166** PWA install prompt is presented contextually (e.g., after a few sessions of use), not immediately on first load.

### 11.28–11.30 Error / Empty / Loading States
- **FR-167** Every screen defines explicit states: Loading, Empty, Success, Error, Offline, Permission Denied, Invalid Input, Storage Failure (full matrix in `TRD.md` §13 and `design.md` §States).
- **FR-168** Error messages are specific and actionable (e.g., "Storage is full — free up space or export and clear old data" rather than "Something went wrong").
- **FR-169** A generic unhandled-error boundary exists app-wide, showing a recovery option (reload / go to Dashboard) and never a blank white screen.
- **FR-170** Every list/collection view (transactions, events, gifts, goals, budgets, automations, notifications) has a distinct, on-brand empty state with a clear next action (e.g., "No expenses yet — Add your first expense").
- **FR-171** Loading states use skeleton placeholders matching the target layout, not an unscoped spinner, for any load expected to take >300ms.

### 11.31 Fun / Educational Games
- **FR-172** Budget Challenge: a short, replayable scenario where the user allocates a hypothetical budget across categories and sees simulated outcomes; entirely local, no real transactions created.
- **FR-173** Savings Streak: tracks consecutive periods (e.g., weeks) where actual spending stayed under budget, shown as a streak counter — derived from real data but purely informational/motivational, not gated behind any reward mechanic.
- **FR-174** Expense Quiz: short multiple-choice quizzes on personal-finance literacy (generic content, not user-data-based).
- **FR-175** Financial Planning Challenge: a guided scenario exercise (e.g., "plan a ₹20,000 trip") producing a suggested plan the user can optionally convert into a real Event + Budget.
- **FR-176** None of the games include gambling mechanics, loot boxes, real-money rewards, or paid monetization of any kind (binding constraint from source brief).

## 12. Edge Cases

- Expense/Income amount entered as 0 or negative → blocked with inline validation (FR-036).
- Two devices independently editing the same JSON export/import cycle → resolved via the Merge/Replace-All flow with conflict flags (FR-140/141); true concurrent editing does not exist in V1 since there is no live sync.
- User changes currency mid-use with existing data in another currency → existing amounts are **not** converted (no FX in V1); the UI clearly labels this and offers to keep the old currency as a display-only historical note (see A-4).
- Deleting a category still referenced by past transactions → blocked until reassignment (FR-053).
- Recurring transaction's `nextOccurrenceDate` falls on a date the user has since deleted context for (e.g., linked event removed) → the recurring item continues independently; the link is simply cleared, not the recurring item itself.
- Import file with a newer `schemaVersion` than the app supports → rejected with an explicit "please update the app" message rather than attempting a lossy partial read.
- Goal `currentAmount` exceeds `targetAmount` (overfunded) → status shows `achieved`, display caps the progress bar at 100% but shows the true amount ("₹65,000 of ₹60,000 goal").
- Storage quota exceeded mid-write → the write is rejected before partial data is committed (NFR-003), and the user sees the specific Storage Failure state (FR-168) with export-then-clear guidance.
- AI Assistant receives an out-of-scope or harmful request (e.g., asking it to fabricate income for a loan application) → it declines and explains it only records real user-provided data.
- Multi-day Event spans a month boundary → appears correctly in both months' Calendar views without double-counting its budget.

## 13. Privacy Requirements

- All financial data is stored exclusively in the browser's `localStorage`; no financial record is ever transmitted to any CAL-EXPENSES server (there is no such server in V1).
- The only network calls containing user-authored content are: (a) Firebase Authentication calls (identity only, no financial data), and (b) the minimal AI proxy call (A-1), which sends only the specific natural-language input and the minimal structured context needed to fulfill that request — never a bulk export of the user's data.
- Users can see, in plain language, exactly what leaves the device and why (FR-156).
- Export/Import/Clear/Delete flows are always user-initiated and never automatic (§11.21–11.25).
- Family data is explicitly labeled local-only to prevent a false sense of shared/synced privacy (FR-093).

## 14. Accessibility Requirements

See `design.md` for the full component-level accessibility specification (contrast tokens, focus states, ARIA patterns, touch target sizing). This PRD binds the product to WCAG 2.1 AA as the minimum bar for all primary flows (NFR-010, FR-158–161).

## 15. Success Metrics

| Metric | Purpose |
|---|---|
| Expense entry completion rate | Measures whether the fast-add flow is actually fast enough to finish, not abandoned mid-entry. |
| Weekly Active Users (WAU) / Daily Active Users (DAU) ratio | Indicates whether usage is a daily habit (calendar-checking) vs. occasional. |
| Budget creation rate (% of users with ≥1 active budget) | Indicates adoption of the core budgeting value proposition, not just logging. |
| AI command success rate (confirmed / attempted) | Measures whether AI intent detection is accurate enough to be trusted, directly informing intent-catalog refinement. |
| Calendar engagement (% of sessions that open Day Detail) | Validates the calendar-first thesis — are users actually using the calendar as the primary lens, not just the Dashboard. |
| Export usage rate | A proxy for trust/backup behavior in a local-first product without server backups. |
| Retention (Week 4) | Standard habit-formation signal. |

Vanity metrics (raw signups, raw page views) are intentionally excluded as primary success measures; each metric above is tied to a specific product hypothesis it validates or invalidates.

## 16. Roadmap

- **V1.0:** Full scope of §11 above.
- **V1.1 (fast-follow):** Refinement of AI intent catalog based on real command success-rate data; additional automation triggers/actions if the fixed catalog proves too narrow.
- **V2 (candidate, not committed):** Optional cloud-sync `StorageProvider` implementation; true multi-user family collaboration; multi-currency with FX; bank-linking research spike; monetization tiers (kept architecturally isolated per source brief — "do not allow monetization assumptions to contaminate the core architecture").

## 17. Appendix — Glossary

- **StorageProvider:** The abstraction layer that decouples business logic from the physical storage mechanism (see `TRD.md` §6).
- **Occurrence:** A computed date instance of a recurring transaction or multi-day event; not a stored record.
- **Schema version:** A version tag on every stored key and export file enabling safe migration.
- **Local-only:** Data that never leaves the browser except via explicit, user-initiated export.
