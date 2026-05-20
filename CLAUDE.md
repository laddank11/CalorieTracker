# NutriTrack

A single-page nutrition tracking app built with Next.js, TypeScript, and Tailwind CSS v4. Log meals by meal category, track daily calories and macros, search the USDA food database, describe meals in plain English, or snap a photo — all persisted in a local SQLite database.

## Quick Start

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # Lint check
```

Requires Node 18+. No accounts, no cloud — just `npm run dev`.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | File-based routing, API routes, SSR/CSR split |
| Language | TypeScript | Type safety across API and UI boundary |
| Styling | Tailwind CSS v4 | Utility-first, no build step |
| Database | SQLite via better-sqlite3 | Zero-config local persistence, sync API |
| Food Data | USDA FoodData Central API | Free, authoritative nutrition database |
| AI | Gemini 2.5 Flash Lite | Text meal description + Vision photo analysis |

## Folder Structure

```
src/
  app/
    page.tsx                  # Main page — header, category picker, tabs, food log
    layout.tsx                # Root layout + metadata
    globals.css               # Tailwind base + fade-up animations
    api/
      search/route.ts         # GET /api/search?q= (USDA + Gemini fallback)
      log/route.ts            # GET /api/log?date=, POST /api/log
      log/[id]/route.ts       # DELETE /api/log/:id
      ai/text/route.ts        # POST /api/ai/text — meal description → macros
      ai/image/route.ts       # POST /api/ai/image — photo → macros
  components/
    CalorieSummary.tsx        # Calorie total, color-coded progress bar, macro bars
    FoodSearch.tsx            # Debounced USDA search, title-cased results
    QuickAdd.tsx              # Grid of 25 common foods
    FoodLog.tsx               # Card-style entries grouped by meal category
    AITextInput.tsx           # Describe-a-meal AI input with item confirm cards
    AIImageUpload.tsx         # Drag-and-drop photo upload + Gemini Vision analysis
  lib/
    db.ts                     # SQLite singleton, auto-creates + migrates schema
    foods.ts                  # 25 hardcoded common foods
    gemini.ts                 # Shared Gemini model constants + helpers
    utils.ts                  # formatFoodName — normalizes USDA ALL-CAPS names
  types/
    index.ts                  # Food, LogEntry, DailyTotals, NutritionAnalysis
data/
  calorie_tracker.db          # SQLite file (gitignored, auto-created at runtime)
docs/                         # Decision logs (initial build, AI routes, design polish)
```

## Environment Variables

```
GEMINI_API_KEY=your-key   # Gemini AI — text + image nutrition analysis
USDA_API_KEY=DEMO_KEY     # USDA FoodData Central (1000 req/hr on DEMO_KEY)
```

Get a free personal USDA key at https://fdc.nal.usda.gov/api-key-signup.html.

## How It Works

1. Page load fetches today's log from `GET /api/log?date=YYYY-MM-DD`
2. SQLite DB auto-initializes and migrates on first API call
3. User picks a meal category (Breakfast/Lunch/Dinner/Snack — defaults to time of day), then adds food via Search, Describe, Photo, or Quick Add
4. `POST /api/log` stores the entry with meal_category; log refetches and re-groups
5. `DELETE /api/log/:id` removes an entry from local state immediately
6. Food names from USDA (ALL CAPS) are normalized to Title Case via `formatFoodName()`
7. Calorie progress bar turns amber at 75%, red at 95% of the 2,000 kcal goal

## Database Schema

```sql
CREATE TABLE food_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  food_name      TEXT    NOT NULL,
  calories       REAL    NOT NULL,
  protein        REAL    NOT NULL,
  carbs          REAL    NOT NULL,
  fat            REAL    NOT NULL,
  serving_size   TEXT    NOT NULL,
  quantity       REAL    DEFAULT 1,
  meal_category  TEXT    DEFAULT 'Snack',   -- added via ALTER TABLE migration
  date           TEXT    NOT NULL,
  created_at     TEXT    DEFAULT (datetime('now'))
)
```

## Design System

- **Background**: `#f4f6f8` (warm off-white) — cards are white on this base
- **Primary**: `emerald-500` — actions, active states, Snack category accent
- **Macros**: `blue-500` protein · `amber-400` carbs · `rose-400` fat
- **Meal accents**: amber (Breakfast) · yellow (Lunch) · indigo (Dinner) · emerald (Snack)
- **Progress bar**: green < 75% · amber 75–94% · red ≥ 95% of goal
- **Typography**: system font stack, `tabular-nums` for all calorie/macro numbers

## Next Steps

- **Deploy to Vercel** — zero-config, swap SQLite for Turso (SQLite-compatible edge DB)
- **Food history charts** — weekly calorie bar chart, 7-day macro trends using Recharts
- **User preferences** — custom calorie goal, macro targets, preferred units (g/oz)
- **Barcode scanning** — Open Food Facts API via device camera for packaged foods
- **Date navigation** — browse and edit past days' logs
- **Export to CSV** — download full log history for spreadsheet analysis
