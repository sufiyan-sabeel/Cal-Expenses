# CAL-EXPENSES — Design System (design.md)

**Version:** 1.0
**Status:** Single source of truth for visual design
**Companion documents:** `PRD.md` (functional requirements this system must support), `TRD.md` (technical constraints — e.g., CSS-variable theming, framework)
**Workflow:** Design tokens → typography → component language → navigation/interaction patterns → connected screens (via Stitch), in that order, per the source brief's execution order. This document is the output of that process, not a set of isolated screens.

---

## 1. Design Principles

1. **Calendar first** — the calendar is the default mental model; every other screen either feeds it or is reached from it.
2. **Data clarity** — a number is never ambiguous; units, signs, and periods are always visible.
3. **Minimal cognitive load** — one primary action per screen; secondary actions are visually subordinate.
4. **Fast entry** — the most common action (add expense) is reachable in ≤2 taps from anywhere.
5. **Privacy first** — local-only data and AI data flow are never hidden from the user; controls are never buried.
6. **AI with user control** — AI proposes, the user disposes; confirmation UI is a first-class, well-designed surface, not an afterthought modal.
7. **Mobile first** — layouts are authored for the smallest breakpoint first, then enhanced upward.
8. **Accessibility by default** — WCAG 2.1 AA is the floor for every component, not a pass applied at the end.
9. **Consistent interactions** — the same gesture/control always means the same thing across modules.
10. **No fake functionality** — nothing in the UI implies a capability the product doesn't have (e.g., no "syncing..." affordance in V1).

## 2. Brand Personality

Premium, calm, trustworthy, quietly intelligent. CAL-EXPENSES should feel closer to a well-made productivity tool (Linear/Notion-grade craft and restraint) than a bank's dashboard or a bright, gamified budgeting app. Confidence comes from clarity and whitespace, not from decoration. AI presence is felt through helpfulness, not through heavy chat-bubble skins or mascot characters.

## 3. Color Tokens

Tokens are CSS custom properties, theme-swapped at the `:root` level for light/dark; component code never hard-codes a hex value.

### 3.1 Core neutrals
```
--surface-canvas        (light: #FAFAFA   | dark: #0B0B0C  — deep neutral, near-AMOLED)
--surface-elevated-1     (light: #FFFFFF   | dark: #141416)
--surface-elevated-2     (light: #F2F2F3   | dark: #1C1C1F)
--surface-overlay        (light: rgba(20,20,22,0.45) | dark: rgba(0,0,0,0.6))
--border-subtle          (light: #E6E6E8   | dark: #262629)
--border-strong          (light: #D0D0D3   | dark: #34343A)
--text-primary           (light: #16161A   | dark: #F2F2F4)
--text-secondary         (light: #57575C   | dark: #A6A6AD)
--text-tertiary          (light: #8A8A90   | dark: #737379)
--text-disabled          (light: #B7B7BC   | dark: #4A4A50)
```

### 3.2 Accent (restrained, single primary accent)
```
--accent-primary         (light: #2F6FED   | dark: #5B8DFF)   // calendar highlight, primary buttons, links
--accent-primary-subtle  (light: #EAF1FE   | dark: #16233F)   // selected states, chips
```

### 3.3 Semantic (never used as the sole differentiator — always paired with icon/shape per accessibility principle)
```
--semantic-income          (light: #1F9D6B | dark: #4BC58F)
--semantic-expense          (light: #E0563F | dark: #FF7A63)
--semantic-warning           (light: #C98A1F | dark: #E3A83F)   // budget 80–99%
--semantic-danger            (light: #D6304A | dark: #F2596F)   // over budget, destructive actions
--semantic-neutral-info       (light: #5B5F97 | dark: #9297D6)   // reminders/automation
```

### 3.4 Calendar indicator dots (icon+color pairing, see §11)
```
--indicator-income     = --semantic-income      (icon: arrow-down-circle)
--indicator-expense     = --semantic-expense     (icon: arrow-up-circle)
--indicator-bill         = --semantic-warning     (icon: receipt)
--indicator-event        = --accent-primary       (icon: calendar-star)
--indicator-gift         = #B15FCF / dark #D08CE8 (icon: gift)
--indicator-goal         = #1D8FA6 / dark #4FC1D9 (icon: flag)
--indicator-reminder      = --semantic-neutral-info (icon: bell)
```

Contrast requirement: every token pairing used for text-on-surface meets ≥4.5:1 (body text) / ≥3:1 (large text, ≥24px or 19px bold) per WCAG 2.1 AA; token values above are chosen to satisfy this in both themes and must be re-verified with a contrast checker if adjusted.

## 4. Typography

**Primary typeface:** *Inter* (Google Fonts) — chosen for its exceptional legibility at small sizes, wide weight range, and tabular-figure support (`font-variant-numeric: tabular-nums`), which is essential for financial columns to align predictably.

**Numeric/monospace-figure use:** Inter's tabular figures are used for all amounts in lists/tables (dates, ₹ amounts, percentages) so digits don't jitter horizontally when values update live.

**Secondary/display option:** *Lexend* for large dashboard hero numbers (e.g., the Current Balance figure) — its design goal is reading-speed optimization, which suits a number a user needs to parse instantly.

```
--font-family-base     = 'Inter', system-ui, sans-serif
--font-family-display   = 'Lexend', 'Inter', system-ui, sans-serif

--font-size-xs   = 12px / line-height 16px   // captions, timestamps
--font-size-sm   = 13px / line-height 18px   // secondary labels, table cells
--font-size-base = 15px / line-height 22px   // body text (deliberately 15, not 16, to match a dense data-app rhythm while staying ≥ typical minimum)
--font-size-md   = 17px / line-height 24px   // card titles
--font-size-lg   = 20px / line-height 28px   // section headers
--font-size-xl   = 26px / line-height 32px   // page titles
--font-size-2xl  = 34px / line-height 40px   // dashboard hero figures (font-family-display)

--font-weight-regular = 400
--font-weight-medium  = 500
--font-weight-semibold = 600
--font-weight-bold    = 700
```

Rationale documented per source-brief requirement: Inter for maximal readability of dense financial data across sizes and its accessibility-friendly letterforms (distinguishable 1/l/I); Lexend specifically for the few "hero number" moments where reading speed under a glance matters most.

## 5. Spacing, Sizing, Radius, Elevation

```
--space-1 = 4px    --space-2 = 8px    --space-3 = 12px   --space-4 = 16px
--space-5 = 20px   --space-6 = 24px   --space-8 = 32px   --space-10 = 40px
--space-12 = 48px  --space-16 = 64px

--radius-sm = 6px      // chips, small buttons
--radius-md = 10px     // inputs, cards
--radius-lg = 16px     // modals, sheets, primary cards
--radius-full = 999px  // avatars, pill badges

--elevation-0 = none                                  // flush surfaces (canvas)
--elevation-1 = 0 1px 2px rgba(0,0,0,0.06)             // resting cards
--elevation-2 = 0 4px 12px rgba(0,0,0,0.10)            // dropdowns, popovers
--elevation-3 = 0 12px 32px rgba(0,0,0,0.16)           // modals, bottom sheets

--touch-target-min = 44px      // WCAG-aligned minimum interactive target on touch surfaces
```

Glass effects are used sparingly and only on exactly two surfaces: the mobile bottom navigation bar and the AI Assistant input dock — both a translucent `--surface-elevated-1` at ~80% opacity with a backdrop blur of 16px, never on cards, modals, or data surfaces (per the "do not overuse glassmorphism" constraint).

## 6. Iconography

- Single consistent icon set (line-style, 1.5px stroke, 20/24px grid) used throughout — calendar indicators, navigation, action buttons, and empty states all draw from the same family so meaning stays consistent (design principle 9).
- Every icon used to convey status/category is paired with a text label or accessible name; icons are never the sole carrier of meaning (ties to WCAG requirement in §14 and Calendar indicator rule in §3.4).

## 7. Core Components

### 7.1 Buttons
- **Primary:** filled `--accent-primary`, `--radius-md`, `--font-weight-semibold`, min height 44px. One primary button per screen/section.
- **Secondary:** outline `--border-strong`, transparent fill, same sizing.
- **Destructive:** filled `--semantic-danger`, reserved exclusively for actions that delete or irreversibly change data, always paired with a confirmation step (never a lone destructive button with no confirmation).
- **Ghost/tertiary:** text-only, `--accent-primary` text color, used for low-emphasis actions (e.g., "Skip" in onboarding).
- States: default, hover (desktop, subtle elevation/darken), focus (2px `--accent-primary` outline, offset 2px — never removed), active/pressed, disabled (`--text-disabled` text, `--border-subtle` fill, `aria-disabled`), loading (inline spinner replacing label, width preserved to avoid layout shift).

### 7.2 Inputs
- Text/number/date inputs: `--radius-md`, `--border-subtle` default, `--accent-primary` border + 2px focus ring on focus, `--semantic-danger` border + inline error text + `aria-invalid`/`aria-describedby` on validation failure (announced via `aria-live="polite"` per PRD FR-161).
- Amount inputs specifically: right-aligned tabular figures, currency symbol as a fixed prefix (not editable), numeric keyboard (`inputmode="decimal"`) on touch devices.
- Category/payment-method pickers: searchable combobox once options exceed ~10 (PRD FR-054), full keyboard operability (arrow keys + type-ahead + Enter to select + Escape to close).

### 7.3 Cards
- Base card: `--surface-elevated-1`, `--radius-lg`, `--elevation-1`, `--space-4` internal padding.
- Stat cards (Dashboard): large `--font-family-display` figure, small label above in `--text-secondary`, optional trend chip (▲/▼ + percentage, color from semantic tokens, always paired with the arrow glyph so color is never the only signal).
- Budget cards: horizontal progress bar (see §7.7) + remaining amount + category icon/color.

### 7.4 Calendar Cell
- Default (Month view): date number top-left, up to 3 indicator dots bottom row, compact "Spent ₹X" micro-label when the cell is wide enough (responsive — hidden below a defined width breakpoint, indicators remain).
- Today: `--accent-primary` 2px ring around the date number.
- Selected: `--accent-primary-subtle` fill.
- Has-data: indicator dots visible (see §3.4 mapping).
- Empty: no dots, date number in `--text-secondary`.
- Disabled (adjacent-month overflow cells): `--text-disabled`, non-interactive but still visible for grid continuity.
- Hover/focus (desktop): `--surface-elevated-2` fill + visible focus ring.
- Drag-select (desktop, multi-day filter): `--accent-primary-subtle` fill spanning the dragged range with a live day-count label.

### 7.5 Dialogs / Sheets
- Desktop: centered modal, `--radius-lg`, `--elevation-3`, max-width 480px for confirmations / 640px for forms; focus is trapped within, Escape closes (non-destructive dialogs only — destructive confirmations require an explicit button press, Escape is disabled for those to avoid accidental dismissal reading as either confirm or cancel ambiguously).
- Mobile: bottom sheet, `--radius-lg` top corners only, drag handle, swipe-down to dismiss (non-destructive only).
- Confirmation dialogs (destructive actions): title states the exact action and count/target ("Delete 3 transactions?"), body explains irreversibility, two clearly differentiated buttons (Cancel = secondary/ghost, Confirm = destructive-red), destructive button is never pre-focused by default to avoid accidental Enter-key confirmation.

### 7.6 Navigation

**Mobile bottom nav (5 items, per source brief):** Home · Calendar · Add (center, elevated circular button) · AI · Profile. Add opens a quick-action sheet: Expense / Income / Event / Bill / Gift / Goal / Note.

**Desktop/tablet:** left sidebar with the same primary destinations plus secondary items (Budgets, Goals, Events, Gifts, Family, Analytics, Automations, Export, Settings) grouped under collapsible sections; a persistent "+ Add" button lives in the top bar.

Active state: `--accent-primary` icon + label + a left-edge accent bar (sidebar) or filled icon background (bottom nav); focus/hover states meet the same contrast bar as buttons.

### 7.7 Progress / Budget Bars
- Track: `--surface-elevated-2`, `--radius-full`, height 8px (10px on touch-oriented layouts for target clarity).
- Fill: semantic color by state — `--semantic-income`-adjacent neutral-positive tone under 80%, `--semantic-warning` 80–99%, `--semantic-danger` ≥100% — always paired with a text percentage/amount label, never color-only (PRD FR-159).
- Overfunded/over-budget: fill continues past the visual track edge with a small "+₹X over" chip rather than clipping silently.

### 7.8 Charts
- Category breakdown: horizontal bar list (more accessible and scannable than a pie chart at this data density) with percentage labels.
- Trend lines: distinguishable by dash pattern in addition to color for multi-series comparisons (e.g., Income vs. Expense).
- Calendar heatmap: 5-level intensity using both color depth and a subtle texture/pattern at the two most intense levels so colorblind users can distinguish "high" from "very high" without relying on hue alone (PRD FR-099).
- Every chart ships with a "View as table" toggle rendering the same series as an accessible HTML table (PRD FR-160).

### 7.9 Tables
- Sticky header row, right-aligned numeric columns with tabular figures, zebra-free (relies on `--border-subtle` row dividers rather than alternating fills, to stay calm/minimal per brand personality).
- Row hover: `--surface-elevated-2`.
- Sortable column headers expose sort state via `aria-sort`.

### 7.10 Badges / Chips
- Category chip: icon + color dot + label, `--radius-full`, used in lists and filters.
- Status badge (e.g., Goal: Achieved / Overdue; Gift: Planned / Purchased): text label always present, color is supplementary.

### 7.11 Notifications (in-app center)
- List item: icon by source type (§3.4 palette reused), title, relative timestamp, unread indicator (dot + bold text, not color alone — bold weight carries the unread signal).
- Swipe-to-dismiss (mobile) / hover-reveal dismiss (desktop); bulk "Mark all read" action at the list header.

### 7.12 AI UI
- **Input dock:** persistent, glass-effect (§5) text input with a mic icon (where voice input is available) pinned to the bottom of the AI Assistant screen and available as a collapsible dock from other screens.
- **Message bubbles:** user messages right-aligned, plain `--surface-elevated-2`; AI responses left-aligned, `--surface-elevated-1` with a small AI mark — never styled as a "chat with a person" skin (no avatar face), to keep the tone assistant-like rather than anthropomorphized.
- **Fact / Estimate / Suggestion labeling (PRD FR-109, binding):** every AI response that states a number carries a small leading tag — `Fact` (neutral badge), `Estimate` (--semantic-neutral-info badge), `Suggestion` (--accent-primary-subtle badge) — rendered as a real UI element, not just implied by wording.
- **Action preview card:** structured, form-like preview (field: value rows) shown before/with confirmation for any write action (PRD FR-107) — visually distinct from a plain message bubble (bordered card, not a speech bubble) to signal "this is about to change your data."
- **Undo toast (quick-add mode, A-10):** bottom-anchored toast, 8-second visible countdown affordance, "Undo" button with the same destructive-adjacent visual weight as a primary action since undoing here prevents an unwanted record.

## 8. Empty States

Each empty state includes: a simple line-icon illustration (from the shared icon family, not a separate illustration style), one sentence explaining the "why," and one primary action. Example copy:
- Expenses: "No expenses yet — add your first one to see it here."
- Events: "No events yet — plan your first birthday, trip, or occasion."
- Budgets: "No budget set for this category — create one to track it here."
- Search: "No matches — try a different date range or keyword."
- Storage quota exceeded: "Local storage is full — export your data, then clear old records to free up space." (paired with direct links to Export and Clear Data.)

## 9. Loading States

- Skeleton placeholders matching the target layout's shape (card outlines, table row bars, calendar grid outline) for any load expected to exceed 300ms (PRD FR-171); no unscoped centered spinners on data-bearing screens.
- The AI "thinking" state uses a subtle three-dot pulse inside the message-bubble position it will occupy, not a full-screen loader, so the rest of the app remains visible/usable.

## 10. Error States

- Inline field errors: red text (`--semantic-danger`) directly below the field, plus an icon, plus `aria-live` announcement (PRD FR-161) — never a top-of-page-only error summary as the sole indicator.
- Screen-level errors (storage failure, corrupted data): a centered panel with a specific message (per `TRD.md` §13 state matrix), a recovery action, and — where relevant — an "Export what we can" fallback rather than a dead end.
- Global error boundary: friendly panel, "Something went wrong on our end" plus a correlation ID, "Reload" and "Go to Dashboard" actions — never a blank white screen (PRD FR-169).

## 11. Calendar Indicator Legend (reference)

| Type | Color token | Icon |
|---|---|---|
| Income | `--indicator-income` | arrow-down-circle |
| Expense | `--indicator-expense` | arrow-up-circle |
| Bill | `--indicator-bill` | receipt |
| Event | `--indicator-event` | calendar-star |
| Gift | `--indicator-gift` | gift |
| Goal | `--indicator-goal` | flag |
| Reminder | `--indicator-reminder` | bell |

This legend is rendered as a persistent, dismissible-but-recallable key above the calendar (desktop) or via a "?" affordance (mobile), since 7 concurrent indicator types exceed what most users will memorize unaided.

## 12. Responsive Behavior

| Breakpoint | Range | Calendar | Navigation | Dashboard |
|---|---|---|---|---|
| Mobile | ≤480px | Week/Agenda default; Month available, compact grid, tap-to-expand Day Detail as bottom sheet | Bottom nav (5 items) + Add sheet | Single-column stacked stat cards |
| Tablet | 481–1024px | Month default, larger cells, Day Detail as side panel | Collapsible sidebar (icon-only default) | 2-column stat grid |
| Laptop | 1025–1440px | Month default, full financial-summary-per-cell | Full sidebar with labels | 3-column stat grid + side calendar preview |
| Desktop | >1440px | Month default, generous cell padding, hover states active | Full sidebar + persistent top bar | 4-column stat grid, multi-panel layout (Dashboard + Calendar preview + Insights side-by-side) |

Mobile is authored as its own layout for each screen (per design principle 7), not a squeezed desktop grid — e.g., the Dashboard's category breakdown becomes a horizontal-scroll card row on mobile rather than a shrunk chart.

## 13. Motion

- Standard transition: 150–200ms, ease-out, applied to hover/focus state changes, sheet/modal open-close, and toast entry/exit.
- Calendar month navigation: 200ms horizontal slide matching swipe direction (mobile) / arrow-key direction (desktop).
- Progress bar fills animate to their new value (300ms ease-out) so budget changes are perceptible, not just a jump-cut.
- **Reduced motion:** when `prefers-reduced-motion: reduce` is set, all of the above collapse to instant/opacity-only transitions (PRD NFR-021); no motion is ever the sole conveyor of information (e.g., a budget crossing 100% is always also color+icon+text, motion is decorative only).

## 14. Accessibility Checklist (component-level, binding)

- Every interactive element has a visible focus indicator meeting ≥3:1 contrast against its background, never `outline: none` without a replacement.
- Full keyboard operability: Tab/Shift+Tab order follows visual/logical order; custom components (comboboxes, date pickers, the calendar grid itself) implement the appropriate ARIA pattern (e.g., `grid`/`gridcell` roles with arrow-key navigation for the calendar).
- Minimum touch target 44×44px on any touch-capable viewport, including calendar cells and indicator dots' tappable hit area (the visual dot may be smaller than the hit area).
- Color is never the sole differentiator anywhere in the product (calendar indicators, budget status, chart series, unread notifications) — always paired with icon, shape, weight, or text.
- All charts have an accessible table alternative (§7.8).
- Form validation errors are both visually indicated and programmatically associated (`aria-describedby`) and announced (`aria-live="polite"`).
- Images/icons conveying meaning have accessible names; purely decorative icons are `aria-hidden`.
- Modals/sheets trap focus and return focus to the triggering element on close.
- The app is fully usable at 200% browser zoom without horizontal scrolling on primary content.
