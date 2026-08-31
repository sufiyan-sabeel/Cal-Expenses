# CAL-EXPENSES — Your money. Your days. One calendar.

Calendar-first personal finance PWA. Expense tracking, income, budgets, goals, events, gift planning, family (local), analytics, AI assistant, automations, games — all localStorage-first, private.

**Live:** https://sufiyan-sabeel.github.io/Cal-Expenses/

## Stack
- Next.js 14 + React 18 + TypeScript (strict)
- Tailwind + design tokens (Inter / Lexend, accent #2F6FED)
- Firebase Auth (Google + email/password, local fallback)
- Zustand + StorageProvider (`calexpenses:v1:*`)
- PWA, responsive, WCAG AA

## Deploy
Push to `main` triggers GitHub Pages deploy via `actions/deploy-pages`. Static export with `basePath: /Cal-Expenses`.

```bash
npm install
npm run dev
NEXT_EXPORT=true npm run build # → out/
```

## License
Private
