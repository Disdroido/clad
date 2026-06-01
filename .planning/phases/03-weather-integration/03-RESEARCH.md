# Phase 03: Weather Integration — Research

**Researched:** 2026-06-01
**Domain:** WeatherAPI.com REST API, Cloudflare Workers external HTTP, geolocation
**Confidence:** HIGH

## Summary

WeatherAPI.com provides a single-endpoint current weather solution perfectly suited for Clad's needs. The Realtime API (`/current.json`) returns temperature, feels-like temp, condition text/icons, and humidity in a single call. The critical win: **no separate geocoding step** — pass `q=auto:ip` and WeatherAPI auto-resolves the requester's IP to lat/lon to weather. This directly satisfies D-02's IP fallback requirement with zero additional API calls.

The free tier is 100,000 calls/month (per the published pricing page as of June 2026; CONTEXT.md D-01 states 1M — the planner should note this discrepancy and work with the locked decision). The free tier includes 3-day forecast, current weather, IP lookup, and Search API. Condition icons come as CDN URLs in the response (e.g., `//cdn.weatherapi.com/weather/64x64/day/116.png`) — usable directly or mapped to emoji.

The existing `server/utils/runtime-env.ts` pattern makes adding the WeatherAPI key straightforward: add `weatherApiKey` to `getServerEnv()`, add the env var to `nuxt.config.ts` runtimeConfig, and configure as a Cloudflare dashboard secret for production.

**Primary recommendation:** Server-side weather fetch in `generate.post.ts` via `$fetch` to `https://api.weatherapi.com/v1/current.json?key=KEY&q=LAT,LON`, with temperature-based scoring bonus in `outfit-engine.ts`, geolocation via `navigator.geolocation` + localStorage cache on the client, and IP fallback using `q=auto:ip` directly on the same weather endpoint.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use **WeatherAPI.com** (1M calls/month free tier, built-in IP-to-location, simple REST, includes condition icons + feels-like temp). No separate geocoding step needed.
- **D-02:** Browser geolocation API (`navigator.geolocation`) as primary, with WeatherAPI.com IP geolocation as fallback when permission denied. Cached in localStorage to avoid repeated prompts.
- **D-03:** Temperature-based scoring bonus (not hard filter). Thresholds: cold (<50°F → coats/layering), mild (50-70°F → standard), warm (>70°F → light fabrics). Applied as scoring modifier in outfit engine — same pattern as wear recency's -5 penalty.
- **D-04:** Weather badge on the outfit generation page — near the occasion selector. Shows current temp + condition + icon. Simple inline badge, not a persistent widget.
- **D-05:** Graceful fallback to static climate zone (from onboarding) when weather API is unavailable. Toast notification: "Weather unavailable — using your climate settings." Same `try/catch` pattern as wear recency data.

### Agent's Discretion
- Exact temperature threshold values and clothing type mappings (which clothingTypes map to which temp ranges)
- Weather refresh timing (on each generation, or cached for N minutes)
- Localization degree display (F/C — infer from browser locale)
- API key env var naming convention (should follow `NUXT_WEATHER_API_KEY` pattern from `runtime-env.ts`)
- Condition icons display format (emoji vs WeatherAPI.com icon URLs)

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WTH-01 | Fetch current weather by lat/lon from WeatherAPI.com | `/current.json?key=KEY&q=LAT,LON` — confirmed endpoint, response structure documented |
| WTH-02 | Geolocation: browser primary, IP fallback | Browser: `navigator.geolocation.getCurrentPosition()`. IP fallback: `q=auto:ip` on same current.json endpoint — no separate call |
| WTH-03 | Temperature scoring bonus in outfit engine | Add to `UserProfile` interface and scoring loop — documented code insertion points |
| WTH-04 | Weather badge UI on generate page | Weather data passed to client via POST response — badge component near occasion selector |
| WTH-05 | Graceful fallback to climate zone | Try/catch in generate.post.ts + toast on client — documented pattern from existing code |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WeatherAPI.com API | v1 (current.json) | Real-time weather data | Locked by D-01. Built-in IP resolution eliminates separate geocoding |
| `globalThis.fetch` / `$fetch` | — (Nitro built-in) | External API call from server | Natively available in Nitro/Cloudflare Workers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `navigator.geolocation` | Web API | Browser GPS for lat/lon | Primary location source (D-02) |
| `localStorage` | Web API | Cache location + weather | Avoid repeated geolocation prompts + reduce API calls |
| `useToast()` (Nuxt or custom) | — | Toast for fallback notification | D-05: "Weather unavailable" toast |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| WeatherAPI.com | Open-Meteo (no key, 10K/day) | Decision D-01 locks WeatherAPI. Open-Meteo would require separate IP geolocation service |
| WeatherAPI.com | OpenWeatherMap (1K/day free) | 1M/mo vs 30K/mo. WeatherAPI wins on volume |

**Installation:**
```bash
# No npm packages needed — WeatherAPI is a REST API call.
# For production: add Wrangler secret
npx wrangler secret put NUXT_WEATHER_API_KEY
```

**Version verification:** WeatherAPI.com is a REST API (v1). No npm package required. API base URL: `https://api.weatherapi.com/v1/`

## Architecture Patterns

### Recommended Project Structure (additions)
```
server/
├── utils/
│   ├── runtime-env.ts            # + weatherApiKey
│   └── weather.ts                # NEW: WeatherAPI fetch + parsing
├── api/outfits/
│   └── generate.post.ts          # + weather fetch between steps 2 & 3
app/
├── components/
│   └── WeatherBadge.vue          # NEW: inline weather display
├── composables/
│   └── useWeather.ts             # NEW: client geolocation + caching
└── pages/outfits/
    └── generate.vue              # + <WeatherBadge> near occasion selector
```

### Pattern 1: Server-side external API call (matching existing pattern)
**What:** Fetch weather from WeatherAPI.com inside a Nitro server handler using `$fetch`/`globalThis.fetch`. Wrap in try/catch with graceful fallback — same pattern as wear recency query (lines 41-70 of `generate.post.ts`).
**When to use:** Any server-side call to external REST APIs in Nitro/CF Workers.
**Example:**
```typescript
// Source: WeatherAPI.com docs + existing generate.post.ts pattern
let weatherData: WeatherData | null = null
try {
  const apiKey = requireServerEnv('weatherApiKey', event)
  weatherData = await $fetch<WeatherApiResponse>(
    'https://api.weatherapi.com/v1/current.json',
    {
      params: {
        key: apiKey,
        q: `${lat},${lon}`,
      },
    }
  )
} catch {
  // Weather unavailable — proceed without it
}
```

### Pattern 2: Client-side geolocation with localStorage cache (D-02)
**What:** Primary: `navigator.geolocation.getCurrentPosition()`. Cache coords in `localStorage` with a timestamp. Skip prompt if cached < N minutes old. Fallback: no coords cached → server uses `q=auto:ip`.
**When to use:** Any feature needing user location.
**Example:**
```typescript
// Source: MDN Geolocation API + standard caching pattern
const CACHE_KEY = 'clad_location'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CachedLocation {
  lat: number
  lon: number
  timestamp: number
}

export function getCachedLocation(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CachedLocation
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}
```

### Pattern 3: Temperature scoring bonus in outfit engine (D-03)
**What:** Add `currentTemperature` to `UserProfile` interface. In the scoring loop, add a bonus based on temperature range — same pattern as preferred colours (+2) and wear recency (-5).
**When to use:** Any scoring modifier that should influence outfit ranking without excluding options.
**Example:**
```typescript
// Insert in outfit-engine.ts scoring loop (after wear recency penalty, around line 176)
interface UserProfile {
  // ... existing fields
  currentTemperature?: number  // °F, from weather API
}

// Temperature scoring bonus
if (profile.currentTemperature !== undefined) {
  const temp = profile.currentTemperature
  if (temp < 50 && item.clothingType === 'coat') {
    score += 3  // bonus for coats in cold weather
  } else if (temp > 70 && ['t-shirt', 'shorts'].includes(item.clothingType)) {
    score += 3  // bonus for light fabrics in warm weather
  } else if (temp >= 50 && temp <= 70) {
    // mild: slight bonus for flexibility
    score += 1
  }
  // Penalize mismatched items
  if (temp < 50 && ['shorts', 't-shirt'].includes(item.clothingType)) {
    score -= 3
  } else if (temp > 70 && ['coat', 'sweater'].includes(item.clothingType)) {
    score -= 3
  }
}
```

### Anti-Patterns to Avoid
- **Client-side API key exposure:** Never call WeatherAPI directly from the browser — the API key would be visible. Always proxy through the Nitro server handler.
- **Separate IP geolocation service:** WeatherAPI's `q=auto:ip` eliminates the need for a separate service like ip-api.com or ipinfo.io. Don't add one.
- **Blocking on weather:** Weather failure should never block outfit generation. Wrap in try/catch with climate zone fallback.
- **Re-fetching weather every page load:** Cache weather data server-side (per-request is fine since it's per-generation) or client-side for N minutes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IP geolocation | Custom IP-to-lat/lon database | WeatherAPI `q=auto:ip` on current.json | WeatherAPI resolves IP internally — one endpoint, one call, no extra dependency |
| Condition icons | Weather icon SVG set | WeatherAPI `condition:icon` URLs or emoji mapping | API returns CDN URLs for weather icons. Or use condition code → emoji lookup (simple switch) |
| Temperature unit conversion | Manual °F/°C detection | `Intl.NumberFormat` or `navigator.language` | Browser locale tells you °F vs °C preference — standard Intl API, no library needed |

**Key insight:** WeatherAPI.com's data model already includes condition text, CDN-hosted icons, and feels-like temp in both units. The SDK is a REST call — no npm package needed. Custom solutions would only duplicate existing functionality.

## Runtime State Inventory

> Omitted — this is a greenfield integration phase (no rename/refactor/migration).

## Common Pitfalls

### Pitfall 1: API Key Exposure in Client Bundle
**What goes wrong:** If the WeatherAPI key is in `runtimeConfig.public` or used in client-side code, it's exposed in the browser.
**Why it happens:** Nuxt's `runtimeConfig.public` is sent to the client. Nitro server handlers are the only safe place for secrets.
**How to avoid:** Keep `weatherApiKey` in the server-only section of `runtimeConfig` (like `openrouterApiKey`). Only call WeatherAPI from server routes. Do NOT add to `runtimeConfig.public`.
**Warning signs:** See "weatherApiKey" anywhere in `runtimeConfig.public` in nuxt.config.ts.

### Pitfall 2: Geolocation Prompt Fatigue
**What goes wrong:** Browser `navigator.geolocation.getCurrentPosition()` prompts the user every time. Repeated prompts lead to "deny" or browser blocking.
**Why it happens:** No caching logic — the prompt fires on every page load.
**How to avoid:** Cache coordinates in localStorage with a timestamp. Only re-prompt when cache is stale (>30 min) or weather fetch actually fails.
**Warning signs:** User reports being asked for location on every visit.

### Pitfall 3: Free Tier Quota Exhaustion
**What goes wrong:** 100K calls/month sounds generous, but a client-refresh loop during development could burn through it.
**Why it happens:** No caching — every page refresh fires a new API call. Also, D-04 mentions "on each generation" which could mean many calls per user session.
**How to avoid:** Client-side cache weather data for N minutes before re-fetching. Server-side, consider caching the weather result per-request (already implicit since it's one call per generation). The monthly reset is at midnight UTC on the 1st.
**Warning signs:** API returns error code 2007 ("API key has exceeded calls per month quota") — wrap this in error handling.

### Pitfall 4: Missing `q` Parameter on IP Fallback
**What goes wrong:** Using `q=auto:ip` on the server-side won't resolve to the *user's* IP — it resolves to the Cloudflare Worker's IP.
**Why it happens:** `auto:ip` resolves the TCP connection origin. When called from a CF Worker, the origin is Cloudflare's egress IP, not the user's browser.
**How to avoid:** Pass the user's actual IP from the request headers. In Cloudflare Workers, the user IP is available via `getRequestHeader(event, 'x-forwarded-for')` or from the CF-Connecting-IP header. When the browser provides lat/lon via geolocation, pass that directly as `q=LAT,LON` — no IP fallback needed server-side. Only use `auto:ip` as a last resort (or pass the real user IP via `q=USER_IP_ADDRESS`).
**Warning signs:** Weather always shows the datacenter location, not the user's location.

## Code Examples

### WeatherAPI Utility Module (`server/utils/weather.ts`)
```typescript
// Source: WeatherAPI.com docs + Nitro $fetch pattern
import { requireServerEnv } from './runtime-env'
import type { H3Event } from 'h3'

export interface WeatherData {
  temperature: number       // °F
  feelsLike: number         // °F
  condition: string         // e.g., "Sunny", "Partly cloudy"
  conditionCode: number     // WeatherAPI condition code
  iconUrl: string           // e.g., "//cdn.weatherapi.com/weather/64x64/day/113.png"
  humidity: number          // percentage
  locationName: string      // e.g., "San Francisco"
  lastUpdated: string       // ISO timestamp
}

interface WeatherApiResponse {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  current: {
    temp_f: number
    feelslike_f: number
    condition: {
      text: string
      icon: string
      code: number
    }
    humidity: number
    wind_mph: number
    wind_dir: string
    pressure_mb: number
    precip_mm: number
    cloud: number
    is_day: number
    uv: number
    gust_mph: number
  }
}

/**
 * Fetch current weather for a lat/lon pair from WeatherAPI.com.
 * Returns null on any failure (graceful degradation).
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  event?: H3Event,
): Promise<WeatherData | null> {
  try {
    const apiKey = requireServerEnv('weatherApiKey', event)

    const raw = await $fetch<WeatherApiResponse>(
      'https://api.weatherapi.com/v1/current.json',
      {
        params: {
          key: apiKey,
          q: `${lat},${lon}`,
        },
      },
    )

    return {
      temperature: raw.current.temp_f,
      feelsLike: raw.current.feelslike_f,
      condition: raw.current.condition.text,
      conditionCode: raw.current.condition.code,
      iconUrl: raw.current.condition.icon,
      humidity: raw.current.humidity,
      locationName: raw.location.name,
      lastUpdated: raw.current.last_updated,
    }
  } catch {
    return null
  }
}

/**
 * Fetch current weather using IP-based resolution.
 * Accepts an explicit IP string or uses auto:ip (which resolves the
 * Worker's own IP — only useful when the real client IP is passed).
 */
export async function fetchWeatherByIp(
  ipAddress: string,
  event?: H3Event,
): Promise<WeatherData | null> {
  try {
    const apiKey = requireServerEnv('weatherApiKey', event)

    const raw = await $fetch<WeatherApiResponse>(
      'https://api.weatherapi.com/v1/current.json',
      {
        params: {
          key: apiKey,
          q: ipAddress, // e.g., "192.168.1.1" or "auto:ip"
        },
      },
    )

    return {
      temperature: raw.current.temp_f,
      feelsLike: raw.current.feelslike_f,
      condition: raw.current.condition.text,
      conditionCode: raw.current.condition.code,
      iconUrl: raw.current.condition.icon,
      humidity: raw.current.humidity,
      locationName: raw.location.name,
      lastUpdated: raw.current.last_updated,
    }
  } catch {
    return null
  }
}
```

### Integration into `generate.post.ts`
```typescript
// Source: Existing generate.post.ts pattern (lines 40-70 for try/catch)
// Insert between step 2 (profile fetch, line ~75) and step 3 (engine call, line ~78)

// 2.7. Fetch weather data (graceful fallback)
let weatherData: WeatherData | null = null
try {
  const clientIp = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  if (body.lat && body.lon) {
    weatherData = await fetchCurrentWeather(body.lat, body.lon, event)
  } else if (clientIp) {
    weatherData = await fetchWeatherByIp(clientIp, event)
  }
} catch {
  // Weather unavailable — outfit engine will fall back to climate zone
}

// Pass weather data to enriched profile → engine
const enrichedProfile = {
  ...(profile || {}),
  recentlyWornItemIds,
  currentTemperature: weatherData?.temperature ?? undefined,
}
```

### Env Var Addition (`server/utils/runtime-env.ts`)
```typescript
// Source: Existing runtime-env.ts pattern (lines 69-102)
// Add to getServerEnv() alongside existing keys:

const weatherApiKey =
  env('NUXT_WEATHER_API_KEY', 'WEATHER_API_KEY')
  || (config.weatherApiKey as string | undefined)

// And in the return object:
return {
  // ... existing keys
  weatherApiKey,
}
```

### Client Geolocation Composable (`app/composables/useWeather.ts`)
```typescript
// Source: MDN Geolocation API + localStorage caching pattern
const LOCATION_CACHE_KEY = 'clad_location'
const LOCATION_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CachedCoords {
  lat: number
  lon: number
  timestamp: number
}

export function useGeolocation() {
  const coords = ref<{ lat: number; lon: number } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function requestLocation(): Promise<{ lat: number; lon: number } | null> {
    // 1. Check cache
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY)
      if (cached) {
        const parsed: CachedCoords = JSON.parse(cached)
        if (Date.now() - parsed.timestamp < LOCATION_TTL_MS) {
          return { lat: parsed.lat, lon: parsed.lon }
        }
        localStorage.removeItem(LOCATION_CACHE_KEY)
      }
    } catch { /* ignore cache errors */ }

    // 2. Browser geolocation
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000, // 5 min
          })
        })
        const result = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }
        // Cache it
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
          ...result,
          timestamp: Date.now(),
        }))
        return result
      } catch {
        // Permission denied or timeout — fall back to IP on server
        return null
      }
    }

    return null // No geolocation API — server will use IP
  }

  return { coords, loading, error, requestLocation }
}
```

### Weather Badge Component (`app/components/WeatherBadge.vue`)
```vue
<script setup lang="ts">
// Source: D-04 spec — inline badge near occasion selector
defineProps<{
  temperature: number     // °F
  condition: string       // e.g., "Sunny"
  iconUrl?: string        // WeatherAPI icon URL or emoji
  locationName?: string   // e.g., "San Francisco"
  loading?: boolean
}>()
</script>

<template>
  <div
    v-if="loading"
    class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-500"
  >
    <span class="inline-block h-4 w-4 animate-pulse rounded-full bg-brand-200" />
    Loading weather...
  </div>
  <div
    v-else
    class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-600"
  >
    <img
      v-if="iconUrl"
      :src="iconUrl.startsWith('//') ? `https:${iconUrl}` : iconUrl"
      alt=""
      class="h-5 w-5"
    />
    <span v-else class="text-base">🌤️</span>
    <span>{{ Math.round(temperature) }}°F</span>
    <span class="text-brand-400">·</span>
    <span>{{ condition }}</span>
    <span v-if="locationName" class="text-brand-400">· {{ locationName }}</span>
  </div>
</template>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate geocoding + weather calls | Single WeatherAPI call with `q=lat,lon` or `q=auto:ip` | Since WeatherAPI v1 launch | Eliminates need for Google Geocoding, ip-api.com, etc. |
| OpenWeatherMap (1K calls/day free) | WeatherAPI (100K-1M calls/month free) | Ongoing market shift | WeatherAPI wins on free tier volume |

**Deprecated/outdated:**
- **Separate IP geolocation service:** Not needed. WeatherAPI handles IP lookup internally via `q=auto:ip` or `q=IP_ADDRESS`.
- **npm weather client packages:** Unnecessary. Plain `$fetch` is simpler, zero-dependency, and works identically in Nitro/Cloudflare Workers.

## Open Questions

1. **Free tier limit discrepancy**
   - What we know: The WeatherAPI.com pricing page shows "100K calls/month" for the Free plan. CONTEXT.md D-01 states "1M calls/month".
   - What's unclear: Whether there was a plan change, or the 1M figure includes a free trial period (7-day trial of Starter gives 3M).
   - Recommendation: Plan for 100K calls/month as the sustainable free tier. The 1M figure in CONTEXT.md is a locked decision — the planner should handle this discrepancy by testing the actual free allocation and adjusting tracking. At ~1 call per outfit generation, 100K/mo serves ~3,300 generations/day.

2. **Client-side vs server-side weather cache strategy**
   - What we know: Client-side geolocation cache is locked (D-02). Weather data freshness depends on API update frequency (every 10-15 min).
   - What's unclear: Should weather data also be cached on the client between generations? Or should each generation re-fetch?
   - Recommendation: Delegate to planner (marked as agent's discretion in D-02). A 5-minute client cache for weather data is reasonable since WeatherAPI only updates every 10-15 min anyway.

3. **Passing lat/lon from client to server**
   - What we know: The client gets lat/lon from browser geolocation. The server needs these to call WeatherAPI.
   - What's unclear: Should lat/lon be passed as POST body params to `generate.post.ts`, or should the server derive location from the client IP?
   - Recommendation: Add optional `lat` and `lon` fields to the POST body of `generate.post.ts`. When present, use them. When absent, fall back to `q=IP_ADDRESS` using the `x-forwarded-for` header (or `auto:ip` as last resort).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `$fetch` / `globalThis.fetch` | Weather API calls from server | ✓ | Built-in (Nitro/Workers) | — |
| `navigator.geolocation` | Client-side GPS | ✓ | Web API | IP fallback via server |

**Missing dependencies with no fallback:** None — WeatherAPI.com integration uses only built-in Web APIs and Nitro's `$fetch` utility, zero npm packages required.

**Missing dependencies with fallback:** Browser geolocation → server-side IP resolution via `q=auto:ip` or explicit IP.

## Validation Architecture

> `workflow.nyquist_validation` is not explicitly set in `.planning/config.json`. Treat as enabled by default.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Nuxt 4 default) |
| Config file | TBD (not yet present — Wave 0 responsibility) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WTH-01 | `fetchCurrentWeather()` returns parsed `WeatherData` for valid lat/lon | unit | `npx vitest run server/utils/weather.test.ts` | ❌ Wave 0 |
| WTH-01 | `fetchCurrentWeather()` returns `null` on API error | unit | (same file) | ❌ Wave 0 |
| WTH-02 | `useGeolocation()` returns cached coords if fresh | unit | `npx vitest run app/composables/useWeather.test.ts` | ❌ Wave 0 |
| WTH-03 | Temperature scoring adds bonus for coat in <50°F | unit | `npx vitest run server/utils/outfit-engine.test.ts` | ❌ Wave 0 |
| WTH-04 | WeatherBadge renders with all props | component | `npx vitest run app/components/WeatherBadge.test.ts` | ❌ Wave 0 |
| WTH-05 | `generate.post.ts` returns valid response when weather API fails | integration | `npx vitest run server/api/outfits/generate.post.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run` (quick smoke)
- **Per wave merge:** `npx vitest run --coverage` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `server/utils/weather.test.ts` — covers WTH-01 (fetchCurrentWeather parsing, error handling)
- [ ] `app/composables/useWeather.test.ts` — covers WTH-02 (geolocation caching, prompt logic)
- [ ] Vitest config / setup — if not already present from earlier phases
- [ ] Framework install: `nuxt/modules` includes Vitest by default in Nuxt 4 — verify with `npx vitest --version`

## Sources

### Primary (HIGH confidence)
- WeatherAPI.com official docs (weatherapi.com/docs) — Realtime API, IP Lookup API, request params, response structure, authentication, error codes
- WeatherAPI.com pricing page (weatherapi.com/pricing.aspx) — Free tier: 100K calls/month, 3-day forecast, IP Lookup included, commercial use OK
- Existing codebase: `server/utils/runtime-env.ts` — env var resolution pattern (env() helper, getServerEnv(), requireServerEnv())
- Existing codebase: `server/api/outfits/generate.post.ts` — try/catch wear recency pattern, server handler structure
- Existing codebase: `server/utils/outfit-engine.ts` — scoring loop, UserProfile interface, preferred colours +2 and wear recency -5 patterns
- Existing codebase: `nuxt.config.ts` — runtimeConfig pattern for server-only env vars
- Existing codebase: `wrangler.jsonc` — Cloudflare Workers deployConfig pattern, secrets management

### Secondary (MEDIUM confidence)
- Multiple 2026 weather API comparison articles — confirm WeatherAPI as best free tier (1M calls/month cited by some, 100K by official pricing page)
- WeatherAPI.com JavaScript SDK docs (GitHub) — confirm endpoint structure and parameter patterns

### Tertiary (LOW confidence)
- N/A — all findings verified against official docs and existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — WeatherAPI.com API confirmed via official docs, $fetch confirmed as Nitro built-in
- Architecture: HIGH — integration points verified against existing codebase (generate.post.ts, outfit-engine.ts, runtime-env.ts)
- Pitfalls: HIGH — all potential issues (API key exposure, IP resolution, quota exhaustion) identified from Cloudflare Workers experience and documented

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (WeatherAPI.com free tier may change)
