# NutriTrack

A nutrition tracking app built with Next.js, TypeScript, and Tailwind CSS. Log meals by meal category, track daily calories and macros, search the USDA food database, describe meals in plain English, or snap a photo — all persisted in a local SQLite database. Includes a points/streak reward system and a cosmetic avatar (Nutri) you can customize with earned points.

## Quick Start

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # Lint check
```

Requires Node 18+.

## Environment Variables

```
GEMINI_API_KEY=your-key   # Gemini AI — text + image nutrition analysis
USDA_API_KEY=DEMO_KEY     # USDA FoodData Central (1000 req/hr on DEMO_KEY)
```

---

## Codebase Summary

### Pages

| Page | File | What it does |
|---|---|---|
| `/` | `src/app/page.tsx` | Main tracker. Loads today's food log, renders all input tabs, shows calorie/macro summary. On food add, saves to DB and claims rewards. |
| `/dashboard` | `src/app/dashboard/page.tsx` | Weekly history chart. Fetches per-day aggregates from `/api/stats`. Shows calorie bars, streak, on-track days. |
| `/nutri` | `src/app/nutri/page.tsx` | Nutri avatar page with three tabs: Avatar (mood + equipped slots), Wardrobe (owned items), Shop (buy cosmetics with points). |
| `/login` | `src/app/login/page.tsx` | Sign-in form. On success the API sets an httpOnly session cookie. |
| `/signup` | `src/app/signup/page.tsx` | Sign-up form. Creates user with hashed password. |

---

### Components

| Component | File | What it does |
|---|---|---|
| `CalorieSummary` | `src/components/CalorieSummary.tsx` | Top card showing calorie count, remaining, progress bar (green → amber → red), and three macro bars. Goals are click-to-edit inline. |
| `FoodSearch` | `src/components/FoodSearch.tsx` | Search tab. Debounces input (400ms), calls USDA search API, renders a grid of food cards. Add button becomes "✓ Added" (disabled) after clicking. |
| `AITextInput` | `src/components/AITextInput.tsx` | Describe tab. Sends plain-English meal description to Gemini, returns item cards to confirm and add. |
| `AIImageUpload` | `src/components/AIImageUpload.tsx` | Photo tab. Drag-and-drop or file pick, sends image to Gemini Vision, same item confirmation flow. |
| `QuickAdd` | `src/components/QuickAdd.tsx` | Quick Add tab. Grid of 25 hardcoded common foods — one-click add. |
| `FoodLog` | `src/components/FoodLog.tsx` | Today's log at the bottom. Groups entries by meal category, shows per-entry macros, quantity, delete button. |
| `PointsBadge` | `src/components/game/PointsBadge.tsx` | Points + streak pill in the header. Links to `/nutri`. Reads from GameContext. |
| `RewardToast` | `src/components/game/RewardToast.tsx` | Global floating toasts when points are earned. Auto-dismiss after 4 seconds. Rendered at the root layout level. |
| `NutriAvatar` | `src/components/game/NutriAvatar.tsx` | The Nutri character on the avatar page. Layers hat, body, outfit, shoes emoji on a background gradient. Shows mood badge. |

---

### Contexts & Hooks

| File | Role |
|---|---|
| `src/contexts/AuthContext.tsx` + `src/hooks/useAuth.ts` | Wraps the whole app. On mount calls `/api/auth/me` to validate the session cookie. Retries once (400ms) before redirecting to `/login` to avoid false logouts. Provides `user`, `isAuthenticated`, `signOut()`, `refreshUser()`. |
| `src/contexts/GameContext.tsx` + `src/hooks/useGame.ts` | Holds points/streak state globally. Provides `loadStatus()` (fetches reward status) and `claimRewards()` (claims points, triggers toasts and level-up banner). |

---

### API Routes

| Route | Method | What it does |
|---|---|---|
| `/api/auth/signup` | POST | Creates user with hashed password, sets session cookie |
| `/api/auth/login` | POST | Verifies password, sets session cookie |
| `/api/auth/logout` | POST | Deletes session from DB, clears cookie |
| `/api/auth/me` | GET | Returns the logged-in user from the session cookie |
| `/api/log` | GET | Returns today's food entries for this user |
| `/api/log` | POST | Adds a food entry to the log |
| `/api/log/[id]` | DELETE | Removes a single food entry |
| `/api/search` | GET | Searches USDA food database, falls back to Gemini if no results |
| `/api/ai/text` | POST | Sends meal description to Gemini → structured nutrition JSON |
| `/api/ai/image` | POST | Sends food photo to Gemini Vision → same output |
| `/api/settings` | GET/PATCH | Reads or updates calorie/macro goals and profile settings |
| `/api/stats` | GET | Returns per-day aggregates for the last 30 days (for dashboard) |
| `/api/rewards/status` | GET | Returns points, streak, level, XP, today's claimed rewards |
| `/api/rewards/claim` | POST | Checks today's goals, awards points if met, updates streak |
| `/api/rewards/history` | GET | Last 30 reward events |
| `/api/avatar` | GET/PATCH | Get Nutri avatar state; equip/unequip items or set mood |
| `/api/shop/items` | GET | Returns the full cosmetic catalog |
| `/api/shop/purchase` | POST | Deducts points, adds item to inventory |
| `/api/shop/inventory` | GET | Returns item IDs the user owns |
| `/api/users/profile` | PATCH | Updates display name or profile image |
| `/api/game/events` | GET | Returns today's daily bonus events (Double Points, Meteor Shower, etc.) |

---

### Library (server-side logic)

| File | Role |
|---|---|
| `src/lib/db.ts` | Creates the SQLite client (local file or Turso URL). Auto-creates all tables on first request. Enables WAL mode for concurrent access. |
| `src/lib/session.ts` | `createSession` / `validateSession` / `deleteSession` — reads/writes the `sessions` table |
| `src/lib/getSession.ts` | Helper used in every API route: extracts the cookie and calls `validateSession` |
| `src/lib/auth.ts` | Cookie name and options (httpOnly, 30-day expiry, secure in production) |
| `src/lib/password.ts` | PBKDF2 password hashing and verification |
| `src/lib/gemini.ts` | Gemini model name, URL builder, JSON response parser, nutrition schema |
| `src/lib/foods.ts` | 25 hardcoded common foods used by QuickAdd |
| `src/lib/utils.ts` | `formatFoodName()` — converts USDA ALL-CAPS names to Title Case |
| `src/lib/game/catalog.ts` | All cosmetic items (40+), rarity colors, mood config, background gradients, reward point values, XP/level math, daily bonus events |
| `src/lib/game/rewards.ts` | `claimDailyRewards` — checks if goals were met, inserts reward rows, updates points + streak + XP |
| `src/lib/game/avatar.ts` | Nutri avatar CRUD: get/equip/unequip items, update mood, purchase items from shop |
| `src/middleware.ts` | Edge middleware: redirects to `/login` if no session cookie is present (before any page loads) |

---

## Navigation Flow

```
Browser visits any URL
        ↓
middleware.ts — has session cookie?
   No  → redirect to /login
   Yes → continue
        ↓
layout.tsx — wraps everything in:
   AuthProvider  (validates cookie with /api/auth/me)
   GameProvider  (loads points/streak state)
   RewardToasts  (floating global notifications)
        ↓
Page renders:
  /          → Main tracker
  /dashboard → History & charts
  /nutri     → Avatar & shop
  /login     → Sign in form
  /signup    → Sign up form
```

### Typical "log a meal" flow

1. User types in Search → `FoodSearch` debounces → `GET /api/search` → USDA results
2. User clicks Add → `page.tsx addFood()` → `POST /api/log` → entry saved to DB
3. `page.tsx` also calls `POST /api/rewards/claim` — checks if any goals are now met
4. If goals met → `GameContext` fires toasts via `RewardToast`, updates points in header badge
5. Food log refetches and `CalorieSummary` updates with new totals

### Database tables

| Table | Purpose |
|---|---|
| `users` | User accounts (id, username, email, hashed password) |
| `sessions` | Active login sessions (token, expiry) |
| `food_log` | Every food entry (name, calories, macros, quantity, date, meal category) |
| `user_settings` | Per-user calorie/macro goals, weight, height, activity level |
| `reward_points` | Running total and lifetime points per user |
| `daily_rewards` | Log of each reward claimed per day (prevents double-claiming) |
| `streaks` | Current and longest streak per user |
| `game_profiles` | XP and level per user |
| `nutri_avatars` | Nutri avatar mood per user |
| `nutri_equipped` | Which cosmetic item is equipped in each category |
| `nutri_inventory` | Items the user has purchased |
