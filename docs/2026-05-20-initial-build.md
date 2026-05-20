# Initial Build — 2026-05-20

## What Was Built

A full calorie and macro tracking web app from scratch, covering:

- **Daily summary panel** — total kcal consumed vs 2000 kcal goal with a progress bar; individual macro bars for protein, carbs, and fat
- **USDA food search** — debounced live search proxied through `/api/search`, returning up to 12 results per query with full macro data
- **Quick Add grid** — 25 hardcoded common foods (chicken breast, eggs, rice, banana, etc.) for one-click logging without typing
- **Food log table** — lists every entry logged today with serving size, cal, P, C, F columns, and a delete button per row
- **Persistent storage** — all log entries saved in a local SQLite file at `data/calorie_tracker.db`; survives page refreshes and server restarts

## Technical Decisions

### Next.js App Router over Pages Router
App Router is the current standard for new Next.js projects. Allows co-locating API routes inside `app/api/` alongside UI pages, and makes future React Server Components easier to add.

### better-sqlite3 for persistence
Chosen over:
- `localStorage` / `IndexedDB` — browser-only, not accessible from API routes, harder to query
- PostgreSQL / MySQL — overkill for a local single-user app, requires running a separate process
- `sqlite3` (async) — synchronous API of `better-sqlite3` is simpler in Next.js API routes and avoids callback/Promise complexity for this use case

The DB file lives in `data/` (gitignored). It's created automatically on first request.

### USDA FoodData Central for food search
Chosen over:
- Hardcoded list only — limits the app to 25 foods, not useful for anything outside that set
- Gemini API — LLMs hallucinate nutrition data; a dedicated food database is more accurate and free
- Nutritionix / Edamam — paid APIs, require account setup

USDA provides authoritative USDA SR Legacy and FNDDS data. `DEMO_KEY` works for personal use (1,000 req/hr). The search is proxied server-side so the API key never reaches the browser.

### 25 hardcoded quick-add foods
Common high-frequency foods that users don't want to search for every day. Stored in `src/lib/foods.ts` as a static array — no DB query needed, instant UX.

### Tailwind CSS v4
New import-only setup (`@import "tailwindcss"`) with no `tailwind.config.js` required for basic use. Dark mode removed from globals.css for simplicity — app uses a light-only design for now.

### TypeScript strict mode
All data flowing from API routes to components is typed with shared interfaces in `src/types/index.ts`, catching shape mismatches at compile time.

## File Count at Completion

```
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/app/api/search/route.ts
src/app/api/log/route.ts
src/app/api/log/[id]/route.ts
src/components/CalorieSummary.tsx
src/components/FoodSearch.tsx
src/components/QuickAdd.tsx
src/components/FoodLog.tsx
src/lib/db.ts
src/lib/foods.ts
src/types/index.ts
next.config.ts
CLAUDE.md
docs/2026-05-20-initial-build.md
```

## Known Limitations at Launch

- No date navigation — only shows today; past logs are in the DB but unreachable from the UI
- Quantity is hardcoded to 1 serving; no way to log "2 eggs" in one tap
- Macro goal targets are hardcoded (2000 kcal, 150g protein, 250g carbs, 65g fat)
- No meal grouping (breakfast / lunch / dinner)
- USDA `DEMO_KEY` has rate limits; heavy use requires a personal key

## What's Planned Next

See `CLAUDE.md` → What's Next section.
