# Design Polish — 2026-05-20

## What Ralph Found

After an initial review of the working app, several issues prevented it from meeting a production quality bar:

**Structural gaps**
- No meal categories — all entries landed in one flat list with no grouping
- Table layout for food entries looked like a data grid, not a consumer app
- No header branding — the page started abruptly with a `<h1>` tag
- Calorie progress bar was a single fixed green, not semantically color-coded

**Visual quality issues**
- USDA food database returns names in ALL CAPS (`BROWN RICE`, `BANANA`) — displayed raw
- Macro progress bars were 6px tall (`h-1.5`) — barely visible as thin lines
- White cards on a white background (`bg-gray-50`) provided minimal contrast
- No loading state on initial fetch — content appeared abruptly
- Inconsistent spacing rhythm across sections
- `gray-*` color classes mixed with `slate-*`, creating subtle inconsistency

**Missing UX details**
- No feedback when adding a food item (no "Added ✓" state)
- Error messages used raw `<p>` text with no visual container
- Empty states used a single emoji + one line of text — too sparse
- No category-level calorie subtotals in the food log

## What Was Improved

### Backend
- Added `meal_category TEXT DEFAULT 'Snack'` column via `ALTER TABLE` migration in `db.ts` — backward-compatible, existing rows default to Snack
- Updated `POST /api/log` to accept and store `meal_category`

### New utility
- `src/lib/utils.ts` — `formatFoodName()`: detects all-uppercase strings (USDA pattern) and converts to Title Case before display or storage

### Design system
- Background changed from flat `gray-50` to `#f4f6f8` — warmer, provides contrast for white cards
- Unified to `slate-*` color scale throughout (removed `gray-*` mixing)
- Colored top accent border on CalorieSummary card tracks calorie status (emerald/amber/rose)
- Meal category accent colors: amber (Breakfast), yellow (Lunch), indigo (Dinner), emerald (Snack)
- Added `tabular-nums` / `font-variant-numeric` for all calorie and macro numbers
- Fade-up entrance animations (`fade-up-1/2/3`) staggered across the three main page sections

### Components rebuilt
| Component | Before | After |
|-----------|--------|-------|
| `CalorieSummary` | Green-only bar, tiny macros, date inline | Color-coded bar (green/amber/red), 10px macro bars, colored top border, "remaining" vs "over goal" |
| `FoodLog` | Flat HTML table | Cards grouped by meal category, left accent border per category, per-group kcal subtotal, item count badge |
| `FoodSearch` | Plain text results | Title-cased names, "Added ✓" feedback state, clear button, error container |
| `QuickAdd` | Plain grid | Hover color matches category, contextual hint text |
| `AITextInput` | Gray cards | Slate design, ✨ icon, ⌘↵ keyboard shortcut hint, "Added ✓" feedback |
| `AIImageUpload` | Basic drop zone | Cleaner proportions, same design language as AITextInput |
| `page.tsx` | Bare `<h1>` | Sticky glass header, category pill selector (defaults to time-of-day), tab bar with icons, `LogSkeleton` loading state, item count badge |

## How the Frontend-Design Skill Verified Quality

The frontend-design skill assessed the Round 1 output and identified five remaining quality gaps:

1. **Macro bars too thin** → increased to `h-2.5` (10px) — now clearly readable
2. **No visual breathing room** → `space-y-5` → `space-y-6`, `py-6` → `py-8` on main
3. **Section labels disappearing** → `text-[11px]` → `text-xs font-bold`, "7 items" as a pill badge
4. **CalorieSummary density** → added `border-t-4` colored accent, increased calorie number to `text-5xl`, tighter spacing between bar and macros
5. **Food cards lacked hierarchy** → `border-l-4` colored accent per meal category ties entries visually to their group

After these changes, the skill confirmed the design met production quality: consistent spacing rhythm, clear typographic hierarchy, semantic color use, and no elements that looked randomly placed.
