# Phase 04: Wardrobe Analytics & Insights — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 04-wardrobe-analytics-insights
**Areas discussed:** Charting library, Analytics page structure, Colour palette analysis, Gap analysis approach, Most-worn data source

---

## Charting Library

| Option | Description | Selected |
|--------|-------------|----------|
| Chart.js + vue-chartjs (Recommended) | ~30KB gzipped, de facto standard for Vue, simple API, good for pie/bar/doughnut | ✓ |
| View-based approach, no chart lib | Render composition as colored div bars (pure CSS/tailwind) and ranked list | |
| You decide | Pick what makes sense given the scope | |

**User's choice:** Chart.js + vue-chartjs (Recommended)
**Notes:** —

---

## Analytics Page Structure

| Option | Description | Selected |
|--------|-------------|----------|
| New dashboard page (Recommended) | Dedicated 'Insights' tab in navigation — `/insights` page with composition, most-worn, gap analysis | ✓ |
| Tab within wardrobe page | Add an 'Analytics' tab/section to wardrobe page | |

**User's choice:** New dashboard page (Recommended)
**Notes:** Nav link in sidebar + mobile bottom nav.

---

## Colour Palette Analysis

| Option | Description | Selected |
|--------|-------------|----------|
| Count the colour field (Recommended) | Simple aggregation of the `colour` string on wardrobeItems — instant, free | ✓ |
| AI vision analysis | Send item images to Gemini for dominant color extraction — more accurate but costs tokens | |
| Combined | Count colour fields + AI analysis on demand | |

**User's choice:** Count the colour field (Recommended)
**Notes:** No AI vision for this phase.

---

## Gap Analysis Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Combined rule + AI (Recommended) | Rules detect missing categories, Gemini enriches with natural-language recommendations | ✓ |
| AI-only | Send entire inventory to Gemini for gap identification | |
| Rule-based only | Pure logic for gap detection | |

**User's choice:** Combined rule + AI (Recommended)
**Notes:** Rules first, then AI enriches.

---

## Most-Worn Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Outfit wearCount | Query outfits sorted by wearCount DESC — simpler | |
| Item-level wear events | Join outfitWearEvents → outfits → wardrobeItems for per-item counts | ✓ |

**User's choice:** Item-level wear events
**Notes:** More complex query but more useful data.

---

## Agent's Discretion

- Chart design details (colors, labels, responsive sizing)
- Nav link icon and placement in sidebar
- Thresholds for gap detection rules
- Number of items in "most-worn" (10? 20?)
- Gap analysis AI prompt design
- Caching strategy for analytics queries (expensive joins)

## Deferred Ideas

None.
