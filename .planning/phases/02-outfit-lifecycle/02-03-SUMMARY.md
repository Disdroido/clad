---
phase: 02-outfit-lifecycle
plan: 03
subsystem: api, engine
tags: drizzle, postgres, outfit-generation, wear-recency, scoring

requires:
  - phase: 02-outfit-lifecycle
    provides: wear_events table, outfitWearEvents schema, wear tracking API
  - phase: 01-core-app
    provides: outfit generation engine, generate endpoint

provides:
  - Wear-aware outfit scoring with -5 penalty for recently worn items
  - Wear data query from generate endpoint with enriched profile passing

affects: None — final plan in phase 02

tech-stack:
  added: []
  patterns:
    - Wear recency penalty scoring in deterministic outfit engine
    - Non-critical data query wrapped in try/catch for graceful degradation

key-files:
  created: []
  modified:
    - server/utils/outfit-engine.ts
    - server/api/outfits/generate.post.ts

key-decisions:
  - "-5 penalty deprioritizes without excluding — graceful fallback when user has limited wardrobe"
  - "Wear data query wrapped in try/catch so missing wear_events table doesn't break generation"
  - "AI reasoning stage receives original profile (no wear data needed for LLM)"

patterns-established:
  - "Wear recency as scoring penalty (not exclusion): -5 points per recently-worn item deprioritizes but still allows if alternatives are scarce"
  - "Graceful degradation: non-critical enrichment data queried in try/catch with empty fallback"

requirements-completed: [WEAR-04]

duration: 3min
completed: 2026-06-01
---

# Phase 02 Plan 03: Smart Generation with Wear Recency Summary

**Wear-aware outfit generation that deprioritizes recently worn items via -5 scoring penalty in the outfit engine, with wear data queried and passed from the generate API endpoint**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-01T02:49:34Z
- **Completed:** 2026-06-01T02:52:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `recentlyWornItemIds` field to `UserProfile` interface for wear recency data
- Implemented -5 scoring penalty for recently worn items across all combination layers (base, outerwear, shoes)
- Query wear events from last 7 days in the generate endpoint, collect item IDs from associated outfits
- Pass enriched profile with wear data to the outfit engine while preserving original profile for AI reasoning
- Graceful try/catch fallback when wear history table is unavailable

## Task Commits

Each task was committed atomically:

1. **Task 1: Update outfit engine to accept and use wear recency data** - `308bceb1` (feat)
2. **Task 2: Pass wear data from API to the outfit engine** - `446cb079` (feat)

## Files Created/Modified
- `server/utils/outfit-engine.ts` - Added `recentlyWornItemIds` to `UserProfile`, wear recency scoring in all combination loops
- `server/api/outfits/generate.post.ts` - Added wear event query, item ID collection, enriched profile passing, try/catch fallback

## Decisions Made
- **-5 penalty vs exclusion:** Using a significant scoring penalty (-5) rather than hard exclusion ensures users with limited wardrobes still get suggestions even when all items were recently worn
- **Graceful degradation:** The wear data query is wrapped in try/catch so missing or empty wear_events table never blocks outfit generation
- **AI reasoning untouched:** The AI reasoning stage receives the original `profile` (not enriched) — wear recency is handled entirely by the deterministic engine, and the LLM doesn't need it for its explanation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 02 is complete — all 3 plans executed
- Wear tracking schema + API (02-01), UI (02-02), and smart generation (02-03) all delivered
- Ready for Phase 03 (Weather Integration) or any follow-on work

## Self-Check: PASSED

- [x] `server/utils/outfit-engine.ts` modified — includes `recentlyWornItemIds`, wear recency scoring, preserved existing logic
- [x] `server/api/outfits/generate.post.ts` modified — includes wear data query, enriched profile, try/catch fallback
- [x] Both commits verified (308bceb1, 446cb079)

---
*Phase: 02-outfit-lifecycle*
*Completed: 2026-06-01*
