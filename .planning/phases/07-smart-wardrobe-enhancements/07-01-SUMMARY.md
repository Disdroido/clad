---
phase: 07-smart-wardrobe-enhancements
plan: "01"
subsystem: wardrobe
tags: [wishlist, crud, api, schema, migration, navigation]
requires: []
provides: [wishlistItems table, wishlist CRUD API, wishlist UI, wardrobe sub-nav]
affects: [server/db/schema.ts, app/pages/wardrobe/index.vue]
tech-stack:
  added: []
  patterns: [defineEventHandler, requireUserId, drizzle-orm, pgEnum, NuxtLink sub-nav]
key-files:
  created:
    - server/db/schema.ts (modified: conditionEnum, isClean/condition/brand/pricePaid/purchaseDate, wishlistItems table)
    - server/db/migrations/0005_spotty_wendell_rand.sql
    - server/api/wardrobe/wishlist/index.get.ts
    - server/api/wardrobe/wishlist/index.post.ts
    - server/api/wardrobe/wishlist/[id].patch.ts
    - server/api/wardrobe/wishlist/[id].delete.ts
    - app/pages/wardrobe/wishlist.vue
  modified:
    - app/pages/wardrobe/index.vue
decisions:
  - pricePaid stored as integer cents to avoid floating-point issues
  - wishlistItems uses separate table (not jsonb array) for query efficiency
  - mark-as-purchased returns suggestedName/suggestedCategory for frontend pre-fill
  - isPurchased items remain visible with "Purchased" badge (not filtered out)
  - mark-as-purchased does NOT auto-create wardrobe items (backend returns suggestion only)
metrics:
  duration: "~5 min"
  completed_date: "2026-06-01"
---

# Phase 7 Plan 1: Wishlist & Schema Foundation Summary

**One-liner:** Manual shopping wishlist with full CRUD API, dedicated wishlist page with add/edit/purchase/delete flow, and wardrobe sub-navigation tabs — plus schema foundation for all Phase 07 features.

## Tasks Executed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Schema foundation + Wishlist API endpoints | ✅ Complete | `b605b1b6` |
| 2 | Wishlist page UI + Wardrobe sub-navigation | ✅ Complete | `abedd9aa` |

## What Was Built

### Schema Changes (`server/db/schema.ts`)
- Added `conditionEnum` pgEnum with values: `new`, `good`, `worn`, `needs_repair`
- Added 5 new columns to `wardrobeItems`: `isClean` (boolean, default true), `condition` (conditionEnum, default 'good'), `brand` (varchar 200), `pricePaid` (integer, stored as cents), `purchaseDate` (timestamp)
- Added new `wishlistItems` table with columns: id, userId (FK), name, category (clothingTypeEnum), priority (varchar, default 'medium'), notes, url, isPurchased (boolean), purchasedAt, createdAt

### API Endpoints (4 new files)
- **GET /api/wardrobe/wishlist** — Returns all wishlist items for authenticated user, ordered by createdAt desc
- **POST /api/wardrobe/wishlist** — Creates wishlist item; validates name required, category must be valid clothing type; defaults priority to 'medium'
- **PATCH /api/wardrobe/wishlist/[id]** — Updates wishlist item with ownership check; when `isPurchased: true` is set, auto-records `purchasedAt` and returns `purchasedItem` object with `suggestedName` and `suggestedCategory`
- **DELETE /api/wardrobe/wishlist/[id]** — Deletes wishlist item with ownership check; returns `{ success: true }`

All endpoints follow the existing `defineEventHandler` → `requireUserId` → `useDb()` pattern.

### UI Changes
- **`/wardrobe/wishlist`** (new, 421 lines) — Full wishlist management page:
  - Loading state (spinner matching app pattern)
  - Empty state (dashed border container + "Add Your First Item" button)
  - Inline add/edit form with name, category (dropdown), priority (dropdown), notes, URL fields
  - Item cards showing: name, priority badge (red=high, amber=medium, blue=low), category badge, truncated notes, external link icon, purchased badge (green)
  - Action buttons: Edit (pencil), Mark Purchased (check), Delete (trash with inline confirm)
  - Purchase toast: "Item marked as purchased! Add to wardrobe?" with link to `/wardrobe/upload?prefill_name=X&prefill_category=Y`
- **`/wardrobe`** (modified) — Added sub-navigation tabs between header and content:
  - "My Wardrobe" tab (active on `/wardrobe`)
  - "Wishlist" tab (links to `/wardrobe/wishlist`)
  - "Laundry" tab (links to `/wardrobe/laundry` — future page)
  - Active tab detection via `useRoute()` computed property with dynamic `:class` binding

### Migration
- Generated `0005_spotty_wendell_rand.sql` — adds `condition` enum type, new columns to `wardrobe_items`, and `wishlist_items` table

## Success Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `wishlistItems` table with all required columns | ✅ |
| 2 | `wardrobeItems` has isClean, condition, brand, pricePaid, purchaseDate | ✅ |
| 3 | All 4 wishlist API endpoints with auth + ownership guards | ✅ |
| 4 | `/wardrobe/wishlist` page with add/edit/delete/purchase | ✅ |
| 5 | Wardrobe sub-nav tabs (Wardrobe \| Wishlist \| Laundry) | ✅ |
| 6 | Migration runs without errors | ✅ |

## Deviations from Plan

None — plan executed exactly as written.

### Type Check Note
`npx nuxi typecheck` failed due to a pre-existing environment issue: `@oxc-parser/binding-darwin-arm64` native binding not found. This is unrelated to plan changes — the project lacks this optional native dependency. All code changes follow existing project patterns and Drizzle migration generation (which compiles the schema) succeeded cleanly.

## Self-Check: PASSED

- [x] `server/db/schema.ts` — `conditionEnum`, `wishlistItems`, `isClean`, `condition`, `brand`, `pricePaid`, `purchaseDate` all present
- [x] `server/api/wardrobe/wishlist/index.get.ts` — exists, follows pattern
- [x] `server/api/wardrobe/wishlist/index.post.ts` — exists, follows pattern
- [x] `server/api/wardrobe/wishlist/[id].patch.ts` — exists, follows pattern
- [x] `server/api/wardrobe/wishlist/[id].delete.ts` — exists, follows pattern
- [x] `app/pages/wardrobe/wishlist.vue` — exists, 421 lines (>60 min), fetch patterns correct
- [x] `app/pages/wardrobe/index.vue` — sub-nav with wishlist and laundry tabs present
- [x] `server/db/migrations/0005_spotty_wendell_rand.sql` — generated successfully
- [x] Commits `b605b1b6`, `abedd9aa` verified in git log
