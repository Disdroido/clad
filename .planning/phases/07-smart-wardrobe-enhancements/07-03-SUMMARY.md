---
phase: 07-smart-wardrobe-enhancements
plan: "03"
subsystem: wardrobe-ui
tags: [laundry, lifecycle, condition, purchase-metadata, outfit-generation]
requires:
  - "07-02 (laundry & lifecycle API endpoints)"
provides:
  - "Laundry overview page with bulk Mark All Clean"
  - "Wardrobe grid condition badges and dirty indicators"
  - "Item detail lifecycle management UI"
  - "Generate page laundry toggle integration"
affects:
  - app/pages/wardrobe/laundry.vue
  - app/pages/wardrobe/index.vue
  - app/pages/wardrobe/items/[id].vue
  - app/pages/outfits/generate.vue
  - app/pages/outfits/result.vue
tech-stack:
  added: []
  patterns:
    - "Vue 3 Composition API with computed, ref, onMounted"
    - "TailwindCSS v4 with brand-* color tokens"
    - "$fetch for API calls with optimistic local state updates"
    - "Price in cents (integer) stored on server, converted to dollars for display"
    - "Toggle switch pattern: inline-flex h-6 w-11 with translate-x-6/x-1"
    - "Condition badge colors: green=new, blue=good, amber=worn, red=needs_repair"
key-files:
  created:
    - app/pages/wardrobe/laundry.vue
  modified:
    - app/pages/wardrobe/index.vue
    - app/pages/wardrobe/items/[id].vue
    - app/pages/outfits/generate.vue
    - app/pages/outfits/result.vue
key-decisions:
  - "Laundry page fetches all items and filters client-side (!item.isClean) rather than a dedicated API endpoint, reusing existing /api/wardrobe/items"
  - "Mark All Clean uses Promise.all with individual PATCH calls, updates local state optimistically after success"
  - "Individual Mark Clean on laundry page removes item from dirty list by updating local items array (!item.isClean → true)"
  - "Wardrobe grid dirty indicator uses opacity-75 on card wrapper (subtle, non-distracting)"
  - "Condition badge on index cards defaults to blue=good when condition is empty/null"
  - "Item detail page splits laundry/condition/lifecycle into independent sections with separate save mechanisms — no coupling to the main Save Changes button"
  - "Purchase metadata section is collapsed by default (showPurchaseMeta=false)"
  - "Price display uses computed get (cents→dollars) and saveLifecycle converts dollars→cents with Math.round"
  - "Laundry toggle on generate page defaults to false (normal behavior: skip dirty items)"
  - "skipLaundry/!includeLaundry naming preserves existing backend contract (skipDirty defaults to true)"
  - "Include laundry preference persists across regenerations via route.query in result page"
metrics:
  plan_start: "2026-06-01T10:55:00Z"
  completed_at: "2026-06-01T10:58:01Z"
  duration: "~3 minutes"
  tasks_completed: 3
  files_modified: 5
  commits: 3
---

# Phase 07 Plan 03: Laundry & Lifecycle UI Summary

**One-liner:** Built all user-facing UI for laundry tracking, item lifecycle management, condition indicators, and outfit generation laundry toggle — completing the Phase 07 UX layer.

## Tasks Executed

### Task 1: Laundry overview page + Wardrobe list indicators
**Commit:** `50178d70`
**Files:** `app/pages/wardrobe/laundry.vue` (created), `app/pages/wardrobe/index.vue` (modified)

- Created `/wardrobe/laundry` page showing dirty items grouped by clothing type category
- Fetches all items from `/api/wardrobe/items`, filters client-side for `!item.isClean`
- "Mark All Clean" button fires Promise.all PATCH calls to `/api/wardrobe/items/:id/laundry`
- Individual "Mark Clean" buttons on each dirty item card
- Empty state: "All clean! 🧺" with dashed border and relaxed messaging
- Loading spinner matching wardrobe/index.vue pattern
- Sub-navigation tabs consistent with wardrobe/index.vue (Wardrobe | Wishlist | Laundry)
- Condition badges on each laundry card with colored pills
- **Wardrobe index updates:** Added `opacity-75` class to dirty item cards, added colored condition badges below sub-type text, added `conditionLabel()` helper

### Task 2: Item detail — condition, laundry, and purchase metadata
**Commit:** `204b9381`
**Files:** `app/pages/wardrobe/items/[id].vue` (modified)

- Extended `Item` interface with `isClean`, `condition`, `brand`, `pricePaid`, `purchaseDate`
- **Laundry Toggle:** Shows current status (Clean & ready to wear / In the laundry) with green "Mark Dirty" or amber "Mark Clean" button, independent PATCH to `/api/wardrobe/items/:id/laundry`
- **Condition Selector:** Four pill buttons (New/Good/Worn/Needs Repair) with matching colors, independent PATCH to `/api/wardrobe/items/:id/lifecycle`
- **Purchase Metadata:** Collapsible section (hidden by default) with brand text input, price (dollars display from cents storage), date picker, and "Save Purchase Details" button
- All three sections save independently via their own PATCH endpoints, no coupling to main Save Changes button

### Task 3: Generate page — laundry toggle integration
**Commit:** `09933a20`
**Files:** `app/pages/outfits/generate.vue` (modified), `app/pages/outfits/result.vue` (modified)

- Added "Include laundry items" toggle switch on generate page between occasion picker and Generate button
- Toggle uses inline-flex h-6 w-11 pattern with translate-x-6/x-1 transition (matches Phase 06 social sharing toggle pattern)
- `includeLaundry` state passed via URL query param to result page
- Result page reads `includeLaundry` from `route.query`, passes `skipLaundry` in POST body to `/api/outfits/generate`
- Preference persists across regenerations (reads fresh from route.query each time)

## Verification Results

All automated checks passed:
- ✅ `app/pages/wardrobe/laundry.vue` exists with isClean and "Mark All Clean" references
- ✅ `app/pages/wardrobe/index.vue` contains condition and isClean references
- ✅ `app/pages/wardrobe/items/[id].vue` contains isClean, condition, brand, and pricePaid references
- ✅ `app/pages/outfits/generate.vue` contains includeLaundry references
- ✅ `app/pages/outfits/result.vue` contains skipLaundry and includeLaundry references
- ✅ All 5 pages exist on disk

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

No stubs found. All data flows are wired to live API endpoints (laundry PATCH, lifecycle PATCH, generate POST). Input placeholders are standard HTML `placeholder` attributes for user guidance.

## Success Criteria

1. ✅ /wardrobe/laundry page groups dirty items by category with Mark All Clean bulk action
2. ✅ Wardrobe item grid shows opacity-75 on dirty items and colored condition badges
3. ✅ Item detail page has laundry toggle, condition selector (pill buttons), and collapsible purchase metadata
4. ✅ Generate page has "Include laundry items" toggle switch
5. ✅ Result page passes skipLaundry preference to API
6. ✅ Condition badges use correct colors: green=new, blue=good, amber=worn, red=needs_repair
7. ✅ All UI follows existing TailwindCSS v4 + brand-* convention
