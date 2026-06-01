# Phase 04: Wardrobe Analytics & Insights — Research

**Researched:** 2026-06-01
**Domain:** Analytics dashboard, Drizzle ORM aggregation, Chart.js integration, AI prompt design
**Confidence:** HIGH

## Summary

This phase adds a data-driven insights dashboard to Clad. Four analytic views (composition pie chart, most-worn bar chart, colour palette swatches, gap analysis card) on a new `/insights` page. The technical challenges are: (1) integrating Chart.js + vue-chartjs in Nuxt 4 with tree-shaking, (2) writing Drizzle ORM aggregation queries for COUNT+GROUP BY and JSONB unnest joins for wear tracking, and (3) designing the combined rule+AI gap analysis prompt for Gemini via OpenRouter.

**Primary recommendation:** Install `chart.js@4.5.1` + `vue-chartjs@5.3.3`. Register specific chart controllers per-component (tree-shaken). Use `count()` + `.groupBy()` for composition queries. For most-worn, use a raw SQL template with `jsonb_array_elements_text()` for efficiency. Reuse existing `server/utils/openrouter.ts` for gap analysis AI calls with a new structured prompt.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use **Chart.js + vue-chartjs** (~30KB gzipped) for pie chart (composition) and bar chart (most-worn). No ECharts — weight not justified for our modest charting needs.
- **D-02:** New **`/insights`** page with dedicated nav link in sidebar and mobile nav. Separate from wardrobe/outfits pages. Sections: Wardrobe Composition (pie), Most-Worn Items (bar/list), Color Palette (swatches), Gap Analysis (AI card).
- **D-03:** Count the `colour` string field on `wardrobeItems` — simple aggregation, instant, no API cost. Group by colour, show as swatch grid with percentage. No AI vision for this phase.
- **D-04:** **Combined rule + AI.** Rules first: detect missing clothing categories (e.g., 0 coats, 0 shoes, uneven tops:bottoms ratio). Then send inventory summary + detected gaps to Gemini via `openrouter.ts` for natural-language recommendations and specific product suggestions.
- **D-05:** **Item-level wear event join.** Join `outfitWearEvents` → `outfits` → extract `itemIds` → count appearances per `wardrobeItems.id`. Returns top N most-worn individual items (not outfits). More complex query but more useful data.

### Agent's Discretion
- Chart design details (colors, labels, responsive sizing)
- Nav link icon and placement in sidebar
- Thresholds for gap detection rules (e.g., tops:bottoms ratio)
- Number of items in "most-worn" (10? 20?)
- Gap analysis AI prompt design
- Caching strategy for analytics queries (expensive joins)

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chart.js | 4.5.1 | Canvas-based chart rendering | Required peer dep for vue-chartjs; tree-shakable, ~30KB gzipped with pie+bar |
| vue-chartjs | 5.3.3 | Vue 3 component wrapper for Chart.js | Official wrapper, Composition API support, reactive prop watchers built-in |

**Installation:**
```bash
npm i vue-chartjs chart.js
```

**Version verification:** `chart.js@4.5.1` and `vue-chartjs@5.3.3` are current as of June 2026. Both are stable, mature packages with active maintenance.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | 0.45.2 (installed) | SQL query builder, aggregation helpers | Count/group queries |
| OpenAI SDK | 4.x (installed) | OpenRouter API calls via existing `openrouter.ts` | Gap analysis AI calls |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vue-chartjs | vue-chart-3 | vue-chart-3 is less maintained; vue-chartjs is the canonical wrapper |
| vue-chartjs | vccs (Vue Charts/Recharts port) | New library, unstable API; vue-chartjs is proven |
| Chart.js | Custom CSS bar/pie divs | Loses chart labeling, legends, animation, and accessibility |

---

## Chart.js + vue-chartjs in Nuxt 4

### Installation Pattern

```bash
npm i vue-chartjs chart.js
```

No Nuxt module needed. vue-chartjs v5 is a direct Vue 3 component library. Import components directly in `.vue` files.

**IMPORTANT:** Chart.js v4 is fully tree-shakable. You **must** register only the controllers, elements, scales, and plugins you use. This is not optional — if elements are not registered, the chart will fail silently (blank canvas).

### Tree-Shaking: What to Register Per Chart Type

| Chart Type | Components to Import & Register |
|------------|-------------------------------|
| **Pie** | `ArcElement`, `Tooltip`, `Legend` |
| **Doughnut** | `ArcElement`, `Tooltip`, `Legend` |
| **Bar** | `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`, `Title` |

**Key insight:** vue-chartjs typed components (Pie, Bar, Doughnut) register their own **controllers** automatically (e.g., importing `Pie` registers `PieController`). You only need to register the **elements, scales, and plugins** manually.

### Component Registration Pattern

**Per-component registration (RECOMMENDED):** Register in each component that uses charts. This is the standard vue-chartjs pattern and keeps imports colocated.

**Global registration:** You could register Chart.js components once in a plugin file, but this adds bundle weight (all components loaded even on pages without charts). Not recommended for a single-page analytics view.

### Responsive Sizing in Tailwind Containers

Chart.js `responsive: true` (default) makes the canvas fill its parent container. The parent needs an explicit height:

```html
<div class="relative h-64">
  <Pie :data="data" :options="options" />
</div>
```

Without a container height, the chart collapses to 0px. Use `h-64`, `h-80`, or `aspect-square` on the wrapper.

### Nuxt 4 / Cloudflare-Specific Gotchas

- **No SSR issues:** Chart.js uses `canvas` (browser API). vue-chartjs components export fine in Nuxt 4 because charts only render client-side. Wrap in `<ClientOnly>` if you want to be explicit, but it's not necessary for charts that only mount after hydration.
- **No module needed:** vue-chartjs v5 requires no Nuxt module. Just import in components.
- **Canvas rendering is pure client-side:** No Cloudflare Worker issues since the chart never touches the server.

---

## Drizzle ORM Aggregation Patterns

### Pattern 1: Wardrobe Composition (COUNT + GROUP BY)

Query items grouped by `clothingType`, `colour`, and `season`:

```typescript
import { count, eq, and } from 'drizzle-orm'
import { wardrobeItems } from '~~/server/db/schema'

// By clothing type
const byType = await db
  .select({
    clothingType: wardrobeItems.clothingType,
    count: count(),
  })
  .from(wardrobeItems)
  .where(and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  ))
  .groupBy(wardrobeItems.clothingType)
  .orderBy(wardrobeItems.clothingType)
// Returns: [{ clothingType: 't-shirt', count: 12 }, ...]

// By colour (count string field)
const byColour = await db
  .select({
    colour: wardrobeItems.colour,
    count: count(),
  })
  .from(wardrobeItems)
  .where(and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  ))
  .groupBy(wardrobeItems.colour)
  .orderBy(desc(count()))
```

**Result type inference:**
```typescript
// count() returns number when using drizzle-orm's count helper
type CompositionResult = { clothingType: string; count: number }[]
```

**Note:** `count()` from `drizzle-orm` returns `number` directly. If using raw `sql\`count(...)\``, you must cast with `sql<number>\`cast(count(...) as int)\`` because PostgreSQL returns `bigint` which TypeScript sees as `string`.

### Pattern 2: Colour Palette Count

This is a simple variation of the above — count by the `colour` varchar column:

```typescript
const colourPalette = await db
  .select({
    colour: wardrobeItems.colour,
    count: count(),
  })
  .from(wardrobeItems)
  .where(and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  ))
  .groupBy(wardrobeItems.colour)
  .orderBy(desc(count()))

// Calculate percentages on the client:
const total = colourPalette.reduce((sum, row) => sum + row.count, 0)
const withPercentage = colourPalette.map(row => ({
  ...row,
  percentage: Math.round((row.count / total) * 100),
}))
```

### Pattern 3: Most-Worn Items (JSONB Array Unnest)

This is the most complex query. `outfits.itemIds` is a `jsonb` array of UUID strings. To count per-item wear frequency:

**Recommended approach: Raw SQL with `jsonb_array_elements_text()`**

```typescript
import { sql } from 'drizzle-orm'

const mostWorn = await db
  .select({
    itemId: sql<string>`wie.item_id`,
    wearCount: sql<number>`COUNT(*)::int`,
  })
  .from(outfitWearEvents)
  .innerJoin(outfits, eq(outfitWearEvents.outfitId, outfits.id))
  .where(eq(outfitWearEvents.userId, userId))
  .groupBy(sql`wie.item_id`)
  .orderBy(desc(sql`COUNT(*)`))
  .limit(10)
// Requires: CROSS JOIN LATERAL jsonb_array_elements_text(outfits.item_ids) AS wie(item_id)
```

But this won't work as a pure Drizzle query because `.from()` and `.innerJoin()` don't natively support `LATERAL` joins. The **production-grade approach** is to use a raw SQL query via the `sql` template:

```typescript
import { sql } from 'drizzle-orm'

const mostWorn = await db.execute(
  sql`
    SELECT wie.item_id, COUNT(*)::int AS wear_count
    FROM outfit_wear_event owe
    INNER JOIN outfits o ON o.id = owe.outfit_id
    CROSS JOIN LATERAL jsonb_array_elements_text(o.item_ids) AS wie(item_id)
    WHERE owe.user_id = ${userId}
    GROUP BY wie.item_id
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `
)
```

Then fetch full item details from `wardrobeItems`:

```typescript
import { inArray } from 'drizzle-orm'

const itemIds = mostWorn.map(r => r.item_id)
const items = await db
  .select()
  .from(wardrobeItems)
  .where(inArray(wardrobeItems.id, itemIds))
```

**Alternative: Application-level aggregation** (simpler, good for small datasets):

```typescript
// Step 1: Get all wear events with their outfits
const events = await db
  .select({
    outfitId: outfitWearEvents.outfitId,
    itemIds: outfits.itemIds,
  })
  .from(outfitWearEvents)
  .innerJoin(outfits, eq(outfitWearEvents.outfitId, outfits.id))
  .where(eq(outfitWearEvents.userId, userId))

// Step 2: Count per item ID in application code
const wearCounts = new Map<string, number>()
for (const event of events) {
  for (const itemId of event.itemIds ?? []) {
    wearCounts.set(itemId, (wearCounts.get(itemId) ?? 0) + 1)
  }
}

// Step 3: Sort and take top N
const topItems = [...wearCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([itemId, wearCount]) => ({ itemId, wearCount }))
```

**Recommendation:** Use the raw SQL approach. It's more efficient (PostgreSQL does the heavy lifting) and the analytics endpoint is read-only, so there's no mutation risk. The raw SQL pattern is safe with parameterized `userId`.

### Pattern 4: Season and Formality Breakdown

```typescript
const bySeason = await db
  .select({
    season: wardrobeItems.season,
    count: count(),
  })
  .from(wardrobeItems)
  .where(and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  ))
  .groupBy(wardrobeItems.season)
  .orderBy(desc(count()))
```

### Performance Implications

- **Composition queries** (COUNT + GROUP BY): Fast, indexed. PostgreSQL aggregates UUID columns efficiently. Expect <10ms for typical wardrobes (50-200 items).
- **Most-worn query**: More expensive because it joins across 3 tables and unnests a JSONB array. For a user with hundreds of wear events, expect 20-50ms. For thousands, consider caching.
- **Colour palette**: Same as composition query — fast.
- **Indexing recommendation:** No additional indexes needed. `wardrobeItems.userId` is already foreign-key-indexed. `outfitWearEvents.userId` is FK-indexed. The analytics queries are per-user and filtered.

---

## Gap Analysis: Rule Engine + AI Enrichment

### Rule Detection Logic

Rules run **before** the AI call and detect gaps deterministically:

| Rule | Logic | Example Output |
|------|-------|---------------|
| Missing category | Count items per clothingType; flag if count = 0 | Missing: coats, shoes |
| Category imbalance | Ratio of tops to bottoms (tops: shirts, t-shirts, blouses, sweaters, hoodies; bottoms: jeans, trousers, shorts, skirts) | "10 tops vs 2 bottoms — consider adding more bottoms" |
| Season coverage | Check if user has items for each season | "0 winter items detected" |
| Formality gaps | Check if user has formal/black_tie items | "No formal wear — consider a blazer or dress" |
| Colour concentration | If 40%+ of items are one colour | "Your wardrobe is 50% black — add colour variety" |

**Thresholds (agent's discretion, recommended defaults):**

```typescript
const GAP_RULES = {
  missingCategories: { threshold: 0, severity: 'high' },
  topsToBottomsRatio: { min: 0.5, max: 2.0, severity: 'medium' },
  seasonCoverage: { requiredSeasons: ['winter', 'summer'], severity: 'low' },
  colourDiversity: { maxSingleColourPct: 40, severity: 'low' },
}
```

### AI Prompt Design for Gap Enrichment

The AI enriches rule-detected gaps with natural-language suggestions. It does NOT identify gaps from scratch.

**Prompt structure:**

```typescript
// The prompt follows the existing pattern in server/utils/openrouter.ts
export async function analyzeGaps(
  inventorySummary: InventorySummary,
  detectedGaps: DetectedGap[],
  userProfile?: UserProfile,
) {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model: 'google/gemini-2.0-flash-lite-001',
    messages: [
      {
        role: 'system',
        content: `You are a fashion stylist AI. Given a user's wardrobe inventory summary and a list of detected gaps, provide personalized recommendations.

For each detected gap:
1. Acknowledge the gap in a friendly, helpful tone
2. Suggest 1-2 specific items that would fill the gap
3. Recommend colours that would work with the user's existing palette
4. Provide a practical reason why the item would add value

Also provide:
- One "surprise insight" about their wardrobe that they might not have noticed
- One long-term wardrobe goal suggestion based on their collection

Be concise, specific, and actionable. Avoid generic advice like "buy more clothes."

Return JSON:
{
  "recommendations": [
    {
      "gap": "string - which gap this addresses",
      "suggestion": "string - natural language suggestion",
      "specificItems": ["string - 1-2 item suggestions"],
      "recommendedColours": ["string - colours that work with existing palette"],
      "whyItMatters": "string - practical value statement"
    }
  ],
  "surpriseInsight": "string - unexpected observation",
  "longTermGoal": "string - wardrobe development suggestion"
}`
      },
      {
        role: 'user',
        text: `Wardrobe Summary: ${JSON.stringify(inventorySummary)}
Detected Gaps: ${JSON.stringify(detectedGaps)}
${userProfile ? `User Preferences: ${JSON.stringify(userProfile)}` : ''}`
      }
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from gap analysis AI')
  return JSON.parse(content)
}
```

**Key design decisions:**
- The prompt explicitly says "do NOT identify gaps from scratch" — this prevents the AI from hallucinating gaps the rules didn't find
- The AI enriches and explains, it doesn't detect — this is the "combined rule + AI" approach per D-04
- Structured JSON output via `response_format` ensures parseable results
- Same model as existing calls (`gemini-2.0-flash-lite-001`) — keeps costs minimal
- Fallback: if AI call fails, display rule-based gaps without enrichment (same try/catch pattern as D-05)

### Inventory Summary Structure

```typescript
interface InventorySummary {
  totalItems: number
  byType: Record<string, number>     // { 't-shirt': 12, 'jeans': 5, ... }
  byColour: Record<string, number>   // { 'black': 20, 'navy': 8, ... }
  bySeason: Record<string, number>   // { 'all_season': 15, 'winter': 5, ... }
  byFormality: Record<string, number> // { 'casual': 25, 'formal': 2, ... }
  totalOutfits: number
  totalWearEvents: number
}
```

---

## Route Design

### API Endpoints

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/analytics` | GET | All analytics data in one call | composition, colourPalette, mostWorn, seasonBreakdown |
| `/api/analytics/gaps` | POST | Gap analysis (rules + AI) | detectedGaps, aiRecommendations |

**Why two endpoints:** The main analytics data is static and fast (cache-friendly). The gap analysis involves an AI call (slow, ~1-2s). Separating them lets the page load instant stats first, then lazy-load gap analysis.

### Page Structure

```
/insights
├── Wardrobe Composition (Doughnut chart)
│   └── Clothing type distribution
├── Most-Worn Items (Bar chart + ranked list)
│   └── Top N individual items
├── Colour Palette (Swatch grid)
│   └── Colour cards with count + percentage
└── Gap Analysis (Card with loading state)
    ├── Rule-based gaps (instant)
    └── AI recommendations (lazy-loaded)
```

### Nav Integration

**Desktop sidebar (`app/layouts/default.vue`):** Add after Outfits:
```typescript
{ label: 'Insights', to: '/insights', icon: '📊' },
```

**Mobile nav (`app/components/BottomNav.vue`):** Replace "What I Wore" or add as 5th item:
```typescript
{ label: 'Insights', to: '/insights', icon: '📊' },
```

Per D-02, the nav link is the agent's discretion on placement and icon.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG/Canvas chart rendering | Chart.js + vue-chartjs | Handles animation, legends, responsive sizing, accessibility labels, tooltip interactions — all the edge cases that take weeks to get right |
| JSONB array unnesting | Custom application-level counting for N items | PostgreSQL `jsonb_array_elements_text()` | Database does the heavy lifting with a single scan. App-level counting loops over every row in memory |
| AI text generation | Hardcoded recommendations | OpenRouter / Gemini via existing `openrouter.ts` | User wardrobes change — AI generates fresh, personalized suggestions per the current inventory |

**Key insight:** These are exactly the "deceptively complex" problems the user identified during the discussion phase. Chart.js was explicitly chosen (D-01) over custom CSS bars, and the JSONB join was chosen (D-05) over the simpler outfit-level wearCount query. Don't second-guess these decisions.

---

## Common Pitfalls

### Pitfall 1: Chart Canvas Collapses to 0px
**What goes wrong:** Chart renders but is invisible (0px height).
**Why it happens:** Chart.js `responsive: true` makes the canvas fill the parent, but the parent container has no explicit height.
**How to avoid:** Always wrap charts in a container with explicit height (e.g., `<div class="relative h-64">`).
**Warning signs:** Chart has data but no visible rendering.

### Pitfall 2: "Cannot find module 'chart.js'" or Blank Canvas
**What goes wrong:** Import errors or chart canvas is blank.
**Why it happens:** Forgetting to register Chart.js components. Chart.js v4 is tree-shakable — importing `Pie` from vue-chartjs does NOT automatically register all Chart.js components.
**How to avoid:** Always call `ChartJS.register(ArcElement, Tooltip, Legend)` before using any chart component.
**Warning signs:** Console warnings about unregistered controllers/elements.

### Pitfall 3: Reactive Data Not Updating Chart
**What goes wrong:** Data changes but chart doesn't re-render.
**Why it happens:** vue-chartjs v5 has built-in watchers, but Vue reactivity wraps the data object. If the same object reference is mutated in-place, the watcher may not fire.
**How to avoid:** Always replace the entire data object (new reference), not mutate properties. Use `computed` or return a fresh object.
**Warning signs:** Data updates in Vue DevTools but chart shows stale data.

### Pitfall 4: JSONB Array Join Performance
**What goes wrong:** Most-worn query is slow or times out.
**Why it happens:** Joining 3 tables with `jsonb_array_elements` on an unindexed column. Without proper indexing, PostgreSQL scans the entire outfit table.
**How to avoid:** Always filter by `userId` first (the wear events query already does this). Optionally add a GIN index on `outfits.item_ids` for large datasets: `CREATE INDEX idx_outfits_item_ids ON outfits USING GIN (item_ids);`
**Warning signs:** Analytics endpoint takes >500ms.

---

## Code Examples

### Example 1: Composition Pie Chart Component

```vue
<script setup lang="ts">
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    data: props.values,
    backgroundColor: [
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#f97316', '#eab308',
      '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ],
    borderWidth: 2,
    borderColor: '#ffffff',
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { padding: 16, font: { size: 12 } },
    },
  },
}
</script>

<template>
  <div class="relative h-72">
    <Pie :data="chartData" :options="chartOptions" />
  </div>
</template>
```

### Example 2: Analytics API Endpoint

```typescript
// server/api/analytics/index.get.ts
import { count, desc, eq, and, sql } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { wardrobeItems, outfits, outfitWearEvents } from '~~/server/db/schema'
import { requireUserId } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()

  const baseWhere = and(
    eq(wardrobeItems.userId, userId),
    eq(wardrobeItems.isArchived, false),
  )

  // 1. Composition by clothing type
  const byType = await db
    .select({
      label: wardrobeItems.clothingType,
      value: count(),
    })
    .from(wardrobeItems)
    .where(baseWhere)
    .groupBy(wardrobeItems.clothingType)
    .orderBy(desc(count()))

  // 2. Colour palette
  const colourPalette = await db
    .select({
      colour: wardrobeItems.colour,
      count: count(),
    })
    .from(wardrobeItems)
    .where(baseWhere)
    .groupBy(wardrobeItems.colour)
    .orderBy(desc(count()))

  // 3. Most-worn items (raw SQL for JSONB unnest)
  const mostWornRaw = await db.execute<{ item_id: string; wear_count: number }>(
    sql`
      SELECT wie.item_id, COUNT(*)::int AS wear_count
      FROM outfit_wear_event owe
      INNER JOIN outfits o ON o.id = owe.outfit_id
      CROSS JOIN LATERAL jsonb_array_elements_text(o.item_ids) AS wie(item_id)
      WHERE owe.user_id = ${userId}
      GROUP BY wie.item_id
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `
  )

  // 4. Fetch full item data for most-worn
  const itemIds = mostWornRaw.rows.map(r => r.item_id)
  const items = itemIds.length > 0
    ? await db
        .select()
        .from(wardrobeItems)
        .where(inArray(wardrobeItems.id, itemIds))
    : []

  const itemsMap = Object.fromEntries(items.map(i => [i.id, i]))
  const mostWorn = mostWornRaw.rows.map(r => ({
    ...itemsMap[r.item_id],
    wearCount: r.wear_count,
  })).filter(r => r.imageUrl) // only show items that still exist

  // 5. Season breakdown
  const bySeason = await db
    .select({
      season: wardrobeItems.season,
      count: count(),
    })
    .from(wardrobeItems)
    .where(baseWhere)
    .groupBy(wardrobeItems.season)

  return {
    composition: byType,
    colourPalette,
    mostWorn,
    seasonBreakdown: bySeason,
  }
})
```

### Example 3: Gap Analysis Rules Engine

```typescript
// server/utils/gap-analysis.ts
import type { InventorySummary, DetectedGap } from '~~/types'

const TOPS = new Set(['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'])
const BOTTOMS = new Set(['jeans', 'trousers', 'shorts', 'skirt'])

export function runGapRules(summary: InventorySummary): DetectedGap[] {
  const gaps: DetectedGap[] = []

  // Missing categories
  const allCategories = ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie',
    'jacket', 'coat', 'jeans', 'trousers', 'shorts', 'skirt', 'dress', 'shoes']
  for (const cat of allCategories) {
    if ((summary.byType[cat] ?? 0) === 0) {
      gaps.push({ type: 'missing_category', detail: cat, severity: 'high' })
    }
  }

  // Tops to bottoms ratio
  const topsCount = Object.entries(summary.byType)
    .filter(([type]) => TOPS.has(type))
    .reduce((sum, [, count]) => sum + count, 0)
  const bottomsCount = Object.entries(summary.byType)
    .filter(([type]) => BOTTOMS.has(type))
    .reduce((sum, [, count]) => sum + count, 0)

  if (bottomsCount > 0 && topsCount / bottomsCount > 3) {
    gaps.push({ type: 'imbalance', detail: 'too_many_tops', severity: 'medium' })
  } else if (topsCount > 0 && bottomsCount / topsCount > 3) {
    gaps.push({ type: 'imbalance', detail: 'too_many_bottoms', severity: 'medium' })
  }

  // Season gaps
  if ((summary.bySeason['winter'] ?? 0) === 0 && summary.totalItems > 5) {
    gaps.push({ type: 'season_gap', detail: 'winter', severity: 'low' })
  }

  return gaps
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart.js v3 (extends + mixins) | Chart.js v4 (tree-shakable + composition API) | v3→v4: 2022, vue-chartjs v4→v5: 2024 | Mixins removed. Components now take reactive props. Must register components explicitly. |
| Outfit-level wearCount | Item-level wear event joins | Phase 04 | More complex query but useful per-item analytics |

**Deprecated/outdated:**
- `Chart.js` v3 `extends` pattern in vue-chartjs — v5 uses direct component props only
- Drizzle ORM relational queries v1 — v2 available in 1.0.0-beta. Not needed for these analytics queries (raw SQL is cleaner for aggregations)

---

## Open Questions

1. **Caching strategy for analytics queries**
   - What we know: Analytics queries are read-only and expensive (JSONB unnest). The `/api/analytics` endpoint could be cached with a short TTL.
   - What's unclear: Should we use Nitro's built-in caching (`cachedEventHandler`) or a simpler approach like `useAsyncData` with `stale-while-revalidate`?
   - Recommendation: Start without caching. If analytics endpoint response time exceeds 300ms for typical users, add a 5-minute Nitro route cache via `cachedEventHandler`.

2. **Number of "most-worn" items to show**
   - What we know: D-05 specifies "top N most-worn items."
   - What's unclear: The optimal N. Too few misses insights, too many clutters the page.
   - Recommendation: Start with 10 (default for charts with readable labels). Make it the agent's discretion.

3. **Chart colour palette**
   - What we know: Charts need to look good with the brand design system.
   - What's unclear: Should chart colours match the brand palette or use a neutral scale?
   - Recommendation: Use a 12-color categorical palette (indigo→pink→amber→green→cyan→blue) that contrasts well. Agent's discretion on specifics.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Nuxt dev server | ✓ | v24.12.0 | — |
| npm | Package install | ✓ | 11.6.2 | — |
| Wrangler | Cloudflare deploy | ✓ | 4.95.0 | — |
| Neon PostgreSQL | Database | ✓ | — (remote service) | — |
| OpenRouter API | AI gap analysis | — | — (runtime config) | Fallback: show only rule-based gaps |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** OpenRouter API key (gap analysis will fall back to rule-based only if the key is missing or the AI call fails).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | none — no test infrastructure exists |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Analytics API returns composition data | integration (manual) | N/A | ❌ |
| REQ-02 | Analytics API returns most-worn items | integration (manual) | N/A | ❌ |
| REQ-03 | Gap rules detect missing categories | unit (manual) | N/A | ❌ |
| REQ-04 | Gap analysis AI enriches rule gaps | integration (manual) | N/A | ❌ |
| REQ-05 | Chart components render without error | manual-only | N/A | ❌ |
| REQ-06 | `/insights` page loads with proper nav | manual-only | N/A | ❌ |

### Wave 0 Gaps
- No test infrastructure exists in the project — no Jest, Vitest, or Playwright configuration
- For this phase, manual verification is acceptable (charts can't be tested easily without browser rendering)
- If test infrastructure is desired, Wave 0 would need: `vitest` + `@vue/test-utils` + `happy-dom` setup

---

## Sources

### Primary (HIGH confidence)
- [vue-chartjs Official Docs](https://vue-chartjs.org/guide/) — Component API, tree-shaking requirements, v5 migration
- [Chart.js Docs: Integration](https://www.chartjs.org/docs/latest/getting-started/integration.html) — Tree-shakable component registration
- [Drizzle ORM Docs: Select](https://orm.drizzle.team/docs/select) — COUNT, GROUP BY, aggregation helpers, raw SQL templates
- [Drizzle ORM Docs: SQL Operator](https://orm.drizzle.team/docs/sql) — `sql` template for raw queries
- Clad codebase: `server/db/schema.ts`, `server/utils/openrouter.ts`, `server/api/outfits/*.ts` — Existing patterns for DB queries and AI calls
- npm registry: `chart.js@4.5.1`, `vue-chartjs@5.3.3`, `drizzle-orm@0.45.2` — Verified current versions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Charts (verified current versions from npm registry); Drizzle (already installed and used in codebase)
- Architecture: HIGH — API route design follows existing patterns; gap analysis follows existing OpenRouter pattern
- Pitfalls: HIGH — Chart.js canvas height issue is well-documented; tree-shaking registration is mandatory; JSONB performance understood

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (30 days — Chart.js/vue-chartjs ecosystem is stable, Drizzle ORM frequent releases may add new helpers but existing APIs won't break)
