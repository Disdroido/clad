---
phase: 04-wardrobe-analytics-insights
plan: 03
subsystem: api, frontend
tags: [drizzle-orm, postgres, openrouter, gemini, gap-analysis, insights, ai-enrichment]
requires:
  - phase: 04-01
    provides: runGapRules rules engine, InventorySummary/DetectedGap types
  - phase: 04-02
    provides: insights page with chart.js visualizations
provides:
  - POST /api/analytics/gaps endpoint (rule-based + AI-enriched gap analysis)
  - Gap analysis card UI on /insights page (CTA, loading, results, fallback)
affects: []
tech-stack:
  added: []
  patterns:
    - Combined rule + AI gap analysis: rules detect deterministically, Gemini enriches with natural-language
    - AI enrichment with graceful fallback: try/catch returns rules-only results when AI unavailable
    - 6 parallel DB queries for inventory summary via Promise.all
    - AI prompt design: system prompt constrains AI to enrich only (not detect gaps from scratch)
key-files:
  created:
    - server/api/analytics/gaps.post.ts
  modified:
    - app/pages/insights/index.vue
key-decisions:
  - "AI enrichment only runs when gaps are detected (no gaps = nothing to enrich)"
  - "AI prompt instructs to enrich, NOT identify gaps from scratch — prevents hallucination per D-04"
  - "Severity badge color scheme: red=high, amber=medium, blue=low"
  - "Rules-only fallback notice includes retry button so users can re-trigger AI"
patterns-established:
  - "Combined rule + AI gap analysis: deterministic rules first, then AI enrichment as enhancement layer"
  - "AI fallback: console.error + null result preserves user experience when AI is down"
requirements-completed:
  - ANALYTICS-03
duration: 1m
completed: 2026-06-01
---

# Phase 04: Wardrobe Analytics & Insights — Plan 03 Summary

**Combined rule + AI gap analysis endpoint (POST /api/analytics/gaps) and gap analysis card UI with severity badges, AI enrichment, and graceful fallback**

## Performance

- **Duration:** 1 min
- **Started:** 2026-06-01T04:19:25Z
- **Completed:** 2026-06-01T04:20:43Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments

- Created `server/api/analytics/gaps.post.ts` — Combined rule + AI gap analysis endpoint:
  - Builds inventory summary from 6 parallel DB queries (COUNT/GROUP BY per type, colour, season, formality, outfits, wear events)
  - Runs deterministic gap rules via `runGapRules()` from existing gap-analysis utils
  - Enriches detected gaps with Gemini AI via OpenRouter (fashion stylist prompt generating specific item suggestions, colour recommendations, and practical reasons)
  - Graceful fallback: returns rules-only results when AI call fails (try/catch with null)
  - Returns `{ gaps, aiRecommendations, inventorySummary }` response shape
- Updated `app/pages/insights/index.vue` — Gap analysis section (Section 4) added below Colour Palette:
  - CTA button ("Analyze My Wardrobe") on initial view
  - Loading spinner with "AI is analyzing your wardrobe..." text
  - Error state with retry button
  - Detected gaps shown as cards with severity badges (red/amber/blue) and human-readable type labels
  - AI enrichment per gap: suggestion, specific items, recommended colours, and why-it-matters rationale
  - Surprise insight + long-term goal cards from AI analysis
  - Rules-only fallback notice with "Try AI analysis again" retry link

## Task Commits

Each task was committed atomically:

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create POST /api/analytics/gaps endpoint | `42dbd122` | `server/api/analytics/gaps.post.ts` |
| 2 | Add gap analysis section to insights page | `98198c6c` | `app/pages/insights/index.vue` |

## Files Created/Modified

- `server/api/analytics/gaps.post.ts` (created, 127 lines) — POST /api/analytics/gaps endpoint. Builds inventory summary, runs gap rules, enriches with AI. Graceful fallback to rules-only.
- `app/pages/insights/index.vue` (modified, +152 lines) — Gap analysis section added at bottom of insights page. Includes CTA, loading, error, and results states.

## Decisions Made

- **AI enrichment only when gaps exist:** The endpoint skips the AI call entirely when `gaps.length === 0`. This avoids unnecessary API costs when a well-balanced wardrobe generates no gaps.
- **Prompt restricts AI to enrichment only:** The system prompt explicitly says to provide recommendations "given detected gaps." This prevents AI from hallucating gaps the rules didn't find (per architecture decision D-04).
- **Severity badge colors:** Red (high) → amber (medium) → blue (low) — standard severity UI pattern, matching common design systems.
- **Fallback UX:** The rules-only fallback notice includes a "Try AI analysis again" button so users can re-trigger the AI call without reloading the page.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Nuxt `nuxi typecheck` cannot find tsconfig (pre-existing issue documented in 04-01). Used `nuxi prepare` + `vue-tsc` workaround. No type errors in our files.
- Pre-existing typecheck errors in other files (`archive.patch.ts`, `openrouter.ts`, `outfit-engine.ts`, `r2.ts`) are scope-boundary items — not addressed per deviation rules.

## User Setup Required

None — no external service configuration required. Gap analysis AI relies on existing OpenRouter configuration (set up in earlier phases). Falls back to rules-only if API key is missing.

## Next Phase Readiness

- Phase 04 is now **complete** — all three plans executed:
  - 04-01: Backend analytics API + gap rules engine ✅
  - 04-02: Insights page UI with charts + nav integration ✅
  - 04-03: Gap analysis API + gap card UI ✅
- Requirement ANALYTICS-03 ("AI identifies wardrobe gaps and suggests missing items") is now complete
- Ready for Phase 05 (Outfit Planning Calendar)

## Self-Check: PASSED

- ✅ `server/api/analytics/gaps.post.ts` exists and committed (`42dbd122`)
- ✅ `app/pages/insights/index.vue` — contains `analyzeGaps` function and `/api/analytics/gaps` reference
- ✅ `nuxt build` — Compiles with zero errors
- ✅ `.planning/phases/04-wardrobe-analytics-insights/04-03-SUMMARY.md` created
- ✅ Each task committed individually

---

*Phase: 04-wardrobe-analytics-insights*
*Completed: 2026-06-01*
