# NutriTrack — Project Plan

## What We Built

A local-first nutrition tracking app with no account required. The full stack:

**Core tracking**
- Daily food log stored in SQLite (`data/calorie_tracker.db`) — zero setup, runs immediately
- Four ways to add food: USDA database search (400k+ foods), AI text description, AI photo analysis, and a quick-add grid of 25 common foods
- Meal categories (Breakfast / Lunch / Dinner / Snack) with time-of-day default
- Delete any entry; log refetches instantly

**AI features**
- `POST /api/ai/text` — describe a meal in plain English; Gemini 2.5 Flash Lite returns per-item macros + totals as structured JSON
- `POST /api/ai/image` — upload a meal photo (drag-and-drop or file picker); Gemini Vision identifies foods and estimates macros
- Both flows return confirm cards so users can review before adding

**Data pipeline**
- USDA search proxied server-side to keep the API key hidden; Gemini runs in parallel as a fuzzy/international fallback
- `formatFoodName()` normalizes USDA ALL-CAPS names to Title Case before display or storage
- `meal_category` added via `ALTER TABLE` migration — fully backward-compatible with existing data

## What We Improved

Starting from a functional but rough initial build, the design was brought to production quality in two passes:

**Pass 1 — Structure**
- Replaced the bare `<h1>` with a sticky glass header (backdrop-blur, border, brand icon)
- Replaced the HTML table log with card-style entries grouped by meal category
- Added `meal_category` support end-to-end: DB column → API → UI picker → log grouping
- Added skeleton loading state, "Added ✓" feedback on food cards, error containers
- Color-coded calorie progress bar: emerald < 75% → amber → rose ≥ 95%

**Pass 2 — Polish (frontend-design skill review)**
- Colored `border-t-4` top accent on summary card tracks calorie status at a glance
- `border-l-4` left accent on food entries connects them visually to their meal category
- Macro bars increased from 6px to 10px — data-encoded bars should be legible
- Spacing rhythm: `space-y-6`, `py-8`, consistent 4/8/12/16/20px scale throughout
- Calorie number increased to `text-5xl` — it's the primary data point and should dominate
- `tabular-nums` applied to all numeric displays — prevents jitter as values update
- Background shifted to `#f4f6f8` (warm off-white) so white cards have contrast to sit on
- Unified all color classes to `slate-*` scale (removed `gray-*` mixing)
- Staggered `fade-up` entrance animations on the three main sections

## Future Roadmap

### Near-term (high value, low complexity)
- **Date navigation** — `<` / `>` arrows to browse past days; today is always the default
- **Export to CSV** — one button downloads full log history for spreadsheet analysis
- **Custom macro goals** — settings drawer to change 2,000 kcal / 150g protein / 250g carbs / 67g fat defaults

### Medium-term (requires more work)
- **Food history charts** — weekly calorie bar chart + 7-day macro area chart using Recharts; minimal data, big insight
- **Barcode scanning** — camera access + Open Food Facts API for packaged foods; eliminates manual entry for common items
- **Meal templates** — save a frequently eaten combination (e.g., "My usual breakfast") and add it in one tap

### Deployment
- **Vercel** — zero-config deploy; swap SQLite for [Turso](https://turso.tech) (libSQL, SQLite-compatible, edge-ready, generous free tier)
- Add `DATABASE_URL` env var; update `db.ts` to use `@libsql/client` instead of `better-sqlite3`
- Everything else (API routes, AI, USDA proxy) works unchanged on Vercel

### Longer-term
- **User preferences** — calorie goal, macro ratios, preferred units (g / oz / ml)
- **Meal photo history** — store uploaded images alongside log entries for visual reference
- **PWA / offline mode** — service worker for offline entry; sync when reconnected
- **Recipe import** — paste a URL, extract ingredients, estimate macros per serving
