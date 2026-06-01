# Phase 03: Weather Integration — Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance outfit suggestions with real-time weather data, temperature-aware filtering, and subtle weather display. Weather data is used as a scoring signal in the outfit engine — not a hard filter. Static climate zone (from user onboarding) acts as fallback.

</domain>

<decisions>
## Implementation Decisions

### Weather API Provider
- **D-01:** Use **WeatherAPI.com** (1M calls/month free tier, built-in IP-to-location, simple REST, includes condition icons + feels-like temp). No separate geocoding step needed.

### Location Source
- **D-02:** Browser geolocation API (`navigator.geolocation`) as primary, with WeatherAPI.com IP geolocation as fallback when permission denied. Cached in localStorage to avoid repeated prompts.

### Temperature-to-Wardrobe Mapping
- **D-03:** Temperature-based scoring bonus (not hard filter). Thresholds: cold (<50°F → coats/layering), mild (50-70°F → standard), warm (>70°F → light fabrics). Applied as scoring modifier in outfit engine — same pattern as wear recency's -5 penalty.

### UI Display
- **D-04:** Weather badge on the outfit generation page — near the occasion selector. Shows current temp + condition + icon. Simple inline badge, not a persistent widget.

### Fallback Behavior
- **D-05:** Graceful fallback to static climate zone (from onboarding) when weather API is unavailable. Toast notification: "Weather unavailable — using your climate settings." Same `try/catch` pattern as wear recency data.

### Agent's Discretion
- Exact temperature threshold values and clothing type mappings (which clothingTypes map to which temp ranges)
- Weather refresh timing (on each generation, or cached for N minutes)
- Localization degree display (F/C — infer from browser locale)
- API key env var naming convention (should follow `NUXT_WEATHER_API_KEY` pattern from `runtime-env.ts`)
- Condition icons display format (emoji vs WeatherAPI.com icon URLs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Environment & Secrets
- `server/utils/runtime-env.ts` — Pattern for adding new API keys; WeatherAPI key follows same `env('NUXT_WEATHER_API_KEY')` pattern

### Integration Points
- `server/api/outfits/generate.post.ts` — Outfit generation endpoint; weather data will be fetched here and passed to engine (same pattern as `recentlyWornItemIds` in lines 40-75)
- `server/utils/outfit-engine.ts` — Scoring function `generateValidOutfits()`; weather-based scoring bonus added alongside wear recency penalty
- `app/pages/outfits/index.vue` or `app/pages/outfits/generate.vue` — Weather display on generation page

### API Documentation
- `https://www.weatherapi.com/docs/` — Current weather endpoint: `GET /current.json?q={location}`

### Schema
- `server/db/schema.ts` — Existing `profiles` table has `climate` column (static fallback)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/utils/runtime-env.ts` — Env var resolution; add weather API key here
- `server/utils/session.ts` — `requireUserId()` auth pattern used by all endpoints
- Existing `generate.post.ts` try/catch pattern — wear recency query wrapped in graceful fallback (lines 41-70)

### Established Patterns
- **Server-side external calls:** Natively available in Nitro via `$fetch` / `globalThis.fetch` — Cloudflare Workers have Web API compatibility
- **Env vars:** Process env → runtimeConfig fallback (see `runtime-env.ts`)
- **Graceful degradation:** Non-critical data wrapped in try/catch with empty fallback

### Integration Points
- `generate.post.ts` — Weather fetch added between existing item/profile fetch and engine call
- `outfit-engine.ts` — Temperature scoring added in the scoring loop (alongside preferred colours +2, wear recency -5)
- Generation page UI — Weather badge component near occasion selector
- `nuxt.config.ts` or `wrangler.toml` — Weather API key needs to be added to env config

</code_context>

<specifics>
## Specific Ideas

- Weather data should be cached client-side for N minutes (TBD by planner) to avoid excessive API calls when user refreshes the generation page
- Feels-like temperature is more important than actual temp for clothing decisions
- Condition text (Sunny, Rain, Snow) shown alongside temperature for context

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-weather-integration*
*Context gathered: 2026-06-01*
