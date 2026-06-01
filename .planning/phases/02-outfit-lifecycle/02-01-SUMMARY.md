---
phase: 02-outfit-lifecycle
plan: 01
subsystem: database, api
tags: drizzle, postgres, neon, wear-tracking, outfit-rating, pagination

requires:
  - phase: 01-core-app
    provides: outfits table, wardrobeItems table, DB connection, auth utilities

provides:
  - wear_events table for storing outfit wear history
  - POST /api/outfits/{id}/wear endpoint
  - PATCH /api/outfits/{id}/rating endpoint
  - GET /api/outfits/wear-history paginated endpoint

affects: 02-02 (wear tracking UI), 02-03 (smart generation with wear recency)

tech-stack:
  added: []
  patterns:
    - Transactional wear logging (insert + update in one tx)
    - Paginated history endpoint with separate count query
    - Batch wardrobe item fetching for nested outfit items

key-files:
  created:
    - server/api/outfits/[id]/wear.post.ts
    - server/api/outfits/[id]/rating.patch.ts
    - server/api/outfits/wear-history.get.ts
  modified:
    - server/db/schema.ts

key-decisions:
  - "Separate wear_events table instead of jsonb array for query efficiency and scalability"
  - "Transactions for atomic wear logging (insert event + update count/date)"
  - "Separate count query for pagination total (not SQL_CALC_FOUND_ROWS)"
  - "Batch item fetch pattern reused from existing wardrobe item lookup"

patterns-established:
  - "Transactional wear logging: insert wear event + increment outfit wearCount in same transaction"
  - "Wear history joins: outfitWearEvents leftJoin outfits for flat + nested response shape"
  - "Pagination: explicit limit (1-100) and offset with count query"

requirements-completed: [WEAR-01, WEAR-02, WEAR-03]

duration: 2min
completed: 2026-06-01
---

# Phase 02 Plan 01: Wear Tracking Schema and API Summary

**Wear events table, wearCount/lastWornAt columns on outfits, and three API endpoints for logging wears, rating outfits, and paginated wear history**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-01T02:46:08Z
- **Completed:** 2026-06-01T02:47:49Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `wearCount` (integer, default 0) and `lastWornAt` (timestamp) columns to `outfits` table via Drizzle schema
- Created `outfit_wear_events` table with proper foreign keys to `outfits` and `user`
- `POST /api/outfits/{id}/wear` logs wear events in a transaction (insert + update count/date atomically)
- `PATCH /api/outfits/{id}/rating` validates and updates outfit rating (1-5)
- `GET /api/outfits/wear-history` returns paginated wear events with outfit details and wardrobe item images

## Task Commits

Each task was committed atomically:

1. **Task 1: Add wear_events table and update outfits schema** - `8ce34f72` (feat)
2. **Task 2: Create wear tracking API endpoints** - `a61fb9bb` (feat)
3. **Task 3: Create wear history API endpoint** - `22f23634` (feat)

## Files Created/Modified
- `server/db/schema.ts` - Added `wearCount`/`lastWornAt` columns to outfits, created `outfitWearEvents` table
- `server/api/outfits/[id]/wear.post.ts` - POST endpoint to log wearing an outfit with optional date/notes
- `server/api/outfits/[id]/rating.patch.ts` - PATCH endpoint to set outfit rating (1-5)
- `server/api/outfits/wear-history.get.ts` - GET endpoint for paginated wear history with outfit details

## Decisions Made
- Used a separate `outfit_wear_events` table instead of a jsonb array on outfits for efficient querying, date range filtering, and scalability
- Wear logging uses a Drizzle transaction to atomically insert the event and increment `wearCount`/update `lastWornAt`
- History endpoint uses a separate `count()` query for total, matching the "simple count" pattern rather than SQL_CALC_FOUND_ROWS
- Batch wardrobe item fetching reuses the same pattern from `outfits/index.get.ts` and `outfits/[id].get.ts`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **esbuild platform mismatch:** Drizzle-kit failed on first run due to `@esbuild/darwin-x64` installed for Rosetta 2, but running on native arm64. Fixed by installing `@esbuild/darwin-arm64` (Rule 3 - Blocking). Package.json/package-lock.json updated accordingly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema and API layer complete for wear tracking
- Ready for 02-02 (wear tracking UI) and 02-03 (smart generation with wear recency)
- All endpoints follow existing auth (requireUserId) and DB (useDb) patterns
- Plan 02-02 UI can consume the POST /wear, PATCH /rating, and GET /wear-history endpoints directly

## Self-Check: PASSED

- [x] All 4 files exist (schema.ts, wear.post.ts, rating.patch.ts, wear-history.get.ts)
- [x] All 3 commits verified (8ce34f72, a61fb9bb, 22f23634)

---
*Phase: 02-outfit-lifecycle*
*Completed: 2026-06-01*
