# Phase 03: Weather Integration — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 03-weather-integration
**Areas discussed:** Weather API provider, Location source, Temperature-to-wardrobe mapping, UI display approach, Fallback behavior

---

## Weather API Provider

| Option | Description | Selected |
|--------|-------------|----------|
| OpenWeatherMap | Industry standard, 1M/mo free, requires separate geocoding step for lat/lon, more complex response structure | |
| WeatherAPI.com (Recommended) | 1M/mo free, built-in IP-to-location resolution, simple REST, includes condition icons + feels-like temp — no lat/lon juggling needed | ✓ |
| You decide | Pick the best option based on constraints | |

**User's choice:** WeatherAPI.com (Recommended)
**Notes:** —

---

## Location Source

| Option | Description | Selected |
|--------|-------------|----------|
| Browser geolocation | navigator.geolocation API — most accurate, cached in localStorage/session | ✓ |
| WeatherAPI.com IP geolocation only | Simplest — no prompt needed, no code needed on our side, but less accurate (city-level only) | |

**User's choice:** Browser geolocation (Recommended)
**Notes:** IP fallback when permission denied.

---

## Temperature-to-Wardrobe Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Temperature-based filtering (Recommended) | Simple threshold system — cold (<50°F) favors coats/layering, mild (50-70°F) uses standard options, warm (>70°F) prefers shorts/light fabrics — as a scoring bonus, not hard filter | ✓ |
| Condition-aware filtering | Temperature thresholds + precipitation check — rain/snow adds umbrella, reduces fabrics that can't get wet | |
| You decide | Choose what makes sense given the engine architecture | |

**User's choice:** Temperature-based filtering (Recommended)
**Notes:** Same scoring bonus pattern as wear recency's -5.

---

## UI Display

| Option | Description | Selected |
|--------|-------------|----------|
| On the generation page (Recommended) | Show current temp + condition near the 'Generate' button / occasion selector | ✓ |
| Persistent sidebar widget | Always-visible weather widget in the sidebar | |
| Both | Weather badge on generation page + minimal indicator in nav | |

**User's choice:** On the generation page (Recommended)
**Notes:** Simple inline badge. AI prompt also gets current conditions.

---

## Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful fallback to climate (Recommended) | Hide weather badge, skip weather-based scoring, generation proceeds using static climate zone + season. Toast notification. Same try/catch pattern as wear recency. | ✓ |
| Info-only | Generation proceeds normally. Just hide the weather badge with no notification. | |

**User's choice:** Graceful fallback to climate (Recommended)
**Notes:** Toast: "Weather unavailable — using your climate settings."

---

## Agent's Discretion

- Exact temperature threshold values and clothing type mappings
- Weather refresh timing (on each generation, or cached for N minutes)
- Localization degree display (F/C — infer from browser locale)
- API key env var naming convention
- Condition icons display format (emoji vs WeatherAPI.com icon URLs)

## Deferred Ideas

None.
