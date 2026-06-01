# Phase 04: Wardrobe Analytics & Insights — Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Data-driven insights about wardrobe composition, style patterns, and gaps. Analytics dashboard, colour palette breakdown, most-worn items, and AI-assisted gap analysis with shopping suggestions.

</domain>

<decisions>
## Implementation Decisions

### Charting Library
- **D-01:** Use **Chart.js + vue-chartjs** (~30KB gzipped) for pie chart (composition) and bar chart (most-worn). No ECharts — weight not justified for our modest charting needs.

### Analytics Page Structure
- **D-02:** New **`/insights`** page with dedicated nav link in sidebar and mobile nav. Separate from wardrobe/outfits pages. Sections: Wardrobe Composition (pie), Most-Worn Items (bar/list), Color Palette (swatches), Gap Analysis (AI card).

### Colour Palette Analysis
- **D-03:** Count the `colour` string field on `wardrobeItems` — simple aggregation, instant, no API cost. Group by colour, show as swatch grid with percentage. No AI vision for this phase.

### Gap Analysis Approach
- **D-04:** **Combined rule + AI.** Rules first: detect missing clothing categories (e.g., 0 coats, 0 shoes, uneven tops:bottoms ratio). Then send inventory summary + detected gaps to Gemini via `openrouter.ts` for natural-language recommendations and specific product suggestions.

### Most-Worn Data Source
- **D-05:** **Item-level wear event join.** Join `outfitWearEvents` → `outfits` → extract `itemIds` → count appearances per `wardrobeItems.id`. Returns top N most-worn individual items (not outfits). More complex query but more useful data.

### Agent's Discretion
- Chart design details (colors, labels, responsive sizing)
- Nav link icon and placement in sidebar
- Thresholds for gap detection rules (e.g., tops:bottoms ratio)
- Number of items in "most-worn" (10? 20?)
- Gap analysis AI prompt design
- Caching strategy for analytics queries (expensive joins)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Model
- `server/db/schema.ts` — `wardrobeItems` (clothingType, colour, season, pattern, formality), `outfits` (wearCount, rating, itemIds), `outfitWearEvents` (wornDate, outfitId), `profiles` (preferredColours, wardrobeGoal)
- `server/utils/openrouter.ts` — AI call pattern for gap analysis (follows existing Gemini pattern)

### Integration Points
- `server/api/wardrobe/` — Existing wardrobe endpoints; analytics queries may follow similar patterns
- `server/api/outfits/index.get.ts` — Outfits listing; analytics may re-use outfit query patterns
- `app/layouts/default.vue` — Add `Insights` nav link (after Outfits, before Settings)
- `app/components/BottomNav.vue` — Add Insights tab to mobile nav (4th item)

### Existing Patterns
- `app/pages/wardrobe/index.vue` — Wardrobe list page; reference for insights page styling
- `app/pages/outfits/wear-history.vue` — Data-heavy page with loading/empty/error states; reference for insights page patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/utils/session.ts` — `requireUserId()` for auth on all analytics API endpoints
- `server/utils/openrouter.ts` — Existing Gemini integration for gap analysis AI
- `app/components/BottomNav.vue` — Mobile navigation; 5th item may be tight (current: Wardrobe, Outfits, What I Wore, Settings)
- `app/layouts/default.vue` — Desktop sidebar navigation; pattern for adding new nav links

### Established Patterns
- **Data fetching:** `$fetch` in `onMounted` with loading/error states
- **Empty states:** Dashed border placeholder with CTA
- **Auth:** `requireUserId` on all server endpoints
- **AI calls:** Try/catch with fallback value (not blocking the feature)

### What Needs to Be Built
- **New DB queries:** Analytics aggregation queries (COUNT by clothingType, colour, season; wear event joins)
- **Analytics API endpoint:** `GET /api/analytics` returning composition, most-worn, colour palette data
- **Gap analysis API endpoint:** `POST /api/analytics/gaps` running rules + AI
- **Insights page:** `/insights` with tabbed/sectioned layout
- **Chart.js setup:** vue-chartjs registration, pie + bar components
- **Nav integration:** Link in sidebar + mobile bottom nav

</code_context>

<specifics>
## Specific Ideas

- Composition chart should show clothing types as a doughnut/pie — tap a segment to see items of that type
- Most-worn items shown as a bar chart + ranked list below
- Colour palette as a grid of color swatches with hex/count labels
- Gap analysis card at the bottom — "Want more out of your wardrobe?" with AI-generated suggestions
- Analytics queries are read-only — no writes needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-wardrobe-analytics-insights*
*Context gathered: 2026-06-01*
