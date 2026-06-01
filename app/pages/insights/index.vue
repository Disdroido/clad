<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Insights — Clad' })

// Chart.js tree-shakable registration (required for v4)
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface AnalyticsResponse {
  composition: { label: string; value: number }[]
  colourPalette: { colour: string; count: number }[]
  mostWorn: Array<{
    id: string
    imageUrl: string
    thumbnailUrl: string
    clothingType: string
    colour: string
    wearCount: number
  }>
  seasonBreakdown: { season: string; count: number }[]
}

// State
const data = ref<AnalyticsResponse | null>(null)
const loading = ref(true)
const error = ref(false)

// Gap analysis state
const gapData = ref<GapAnalysisResponse | null>(null)
const gapLoading = ref(false)
const gapError = ref(false)

interface GapAnalysisResponse {
  gaps: Array<{ type: string; detail: string; severity: string }>
  aiRecommendations: {
    recommendations: Array<{
      gap: string; suggestion: string; specificItems: string[]
      recommendedColours: string[]; whyItMatters: string
    }>
    surpriseInsight: string
    longTermGoal: string
  } | null
}

async function analyzeGaps() {
  gapLoading.value = true
  gapError.value = false
  try {
    gapData.value = await $fetch<GapAnalysisResponse>('/api/analytics/gaps', { method: 'POST' })
  } catch {
    gapError.value = true
    gapData.value = null
  } finally {
    gapLoading.value = false
  }
}

// Severity badge color mapping
const severityBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

// Gap type labels
const gapTypeLabels: Record<string, string> = {
  missing_category: 'Missing Category',
  imbalance: 'Category Imbalance',
  season_gap: 'Season Gap',
  colour_concentration: 'Colour Concentration',
}

// Colour mapping for palette swatches
const COLOUR_HEX: Record<string, string> = {
  'black': '#1a1a1a', 'white': '#ffffff', 'navy': '#1a2744',
  'grey': '#808080', 'brown': '#8b4513', 'beige': '#f5f5dc',
  'blue': '#3b82f6', 'red': '#ef4444', 'green': '#22c55e',
  'yellow': '#eab308', 'orange': '#f97316', 'pink': '#ec4899',
  'purple': '#a855f7', 'burgundy': '#800020', 'cream': '#fffdd0',
  'olive': '#808000', 'teal': '#14b8a6', 'maroon': '#800000',
  'coral': '#ff7f50', 'khaki': '#c3b091', 'ivory': '#fffff0',
  'charcoal': '#36454f', 'tan': '#d2b48c', 'rust': '#b7410e',
  'mint': '#98ff98', 'lavender': '#e6e6fa', 'mustard': '#ffdb58',
  'indigo': '#4b0082', 'taupe': '#483c32', 'camel': '#c19a6b',
  'denim': '#1565c0',
}

// Chart colours (12-color categorical palette for doughnut)
const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

// Fetch data
onMounted(async () => {
  try {
    data.value = await $fetch<AnalyticsResponse>('/api/analytics')
  } catch {
    error.value = true
    data.value = null
  } finally {
    loading.value = false
  }
})

// Computed chart data — generate new objects for vue-chartjs reactivity
const compositionChartData = computed(() => {
  if (!data.value?.composition) return { labels: [], datasets: [] }
  return {
    labels: data.value.composition.map(c => c.label),
    datasets: [{
      data: data.value.composition.map(c => c.value),
      backgroundColor: CHART_COLORS.slice(0, data.value.composition.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }
})

const compositionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { padding: 16, font: { size: 12 } } },
  },
}

const mostWornChartData = computed(() => {
  if (!data.value?.mostWorn?.length) return { labels: [], datasets: [] }
  return {
    labels: data.value.mostWorn.map(i => `${i.clothingType}`),
    datasets: [{
      label: 'Times Worn',
      data: data.value.mostWorn.map(i => i.wearCount),
      backgroundColor: '#6366f180',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 4,
      maxBarThickness: 32,
    }],
  }
})

const mostWornChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const, // horizontal bars for readable labels
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.raw} time${ctx.raw === 1 ? '' : 's'}`,
      },
    },
  },
  scales: {
    x: { beginAtZero: true, ticks: { stepSize: 1 } },
    y: { ticks: { font: { size: 11 } } },
  },
}

// Colour palette with percentages
const paletteWithPercent = computed(() => {
  if (!data.value?.colourPalette) return []
  const total = data.value.colourPalette.reduce((s, r) => s + r.count, 0)
  return data.value.colourPalette.map(row => ({
    ...row,
    percentage: Math.round((row.count / total) * 100),
    hex: COLOUR_HEX[row.colour.toLowerCase()] || '#cccccc',
  }))
})

const hasData = computed(() => data.value?.composition?.length)
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold text-brand-950">Insights</h1>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-red-700">Couldn't load your insights. Please try again.</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasData" class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <p class="mb-4 text-brand-500">Add some items to your wardrobe to see insights!</p>
      <NuxtLink to="/wardrobe/upload" class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition">
        Add Items
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-else class="space-y-8">

      <!-- Section 1: Wardrobe Composition -->
      <section class="rounded-xl bg-white p-6 shadow-sm border border-brand-100">
        <h2 class="mb-1 text-lg font-semibold text-brand-900">Wardrobe Composition</h2>
        <p class="mb-4 text-sm text-brand-500">Your clothing type distribution</p>
        <div class="relative h-72">
          <Doughnut :data="compositionChartData" :options="compositionChartOptions" />
        </div>
      </section>

      <!-- Section 2: Most-Worn Items -->
      <section class="rounded-xl bg-white p-6 shadow-sm border border-brand-100">
        <h2 class="mb-1 text-lg font-semibold text-brand-900">Most-Worn Items</h2>
        <p class="mb-4 text-sm text-brand-500">Your most frequently worn individual pieces</p>
        <div v-if="data.mostWorn?.length" class="relative h-64">
          <Bar :data="mostWornChartData" :options="mostWornChartOptions" />
        </div>
        <!-- Ranked list below chart -->
        <div v-if="data.mostWorn?.length" class="mt-4 space-y-2">
          <NuxtLink v-for="(item, idx) in data.mostWorn.slice(0, 10)" :key="item.id"
            :to="`/wardrobe/items/${item.id}`"
            class="flex items-center gap-3 rounded-lg bg-brand-50 p-2 hover:bg-brand-100 transition">
            <span class="w-6 text-center text-sm font-bold text-brand-400">#{{ idx + 1 }}</span>
            <img :src="item.imageUrl" :alt="item.clothingType"
                 class="h-10 w-10 rounded-md border border-brand-200 object-cover" />
            <div class="flex-1 min-w-0">
              <p class="truncate text-sm font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
              <p class="text-xs text-brand-500">{{ item.colour }}</p>
            </div>
            <span class="text-sm font-semibold text-brand-700">{{ item.wearCount }}x</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Section 3: Colour Palette -->
      <section class="rounded-xl bg-white p-6 shadow-sm border border-brand-100">
        <h2 class="mb-1 text-lg font-semibold text-brand-900">Colour Palette</h2>
        <p class="mb-4 text-sm text-brand-500">Your most-used colours</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div v-for="c in paletteWithPercent" :key="c.colour"
               class="rounded-lg border border-brand-100 overflow-hidden bg-white">
            <div class="h-12 w-full" :style="{ backgroundColor: c.hex }" />
            <div class="p-2">
              <p class="text-sm font-medium text-brand-900 capitalize truncate">{{ c.colour }}</p>
              <p class="text-xs text-brand-500">{{ c.count }} items ({{ c.percentage }}%)</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Gap Analysis -->
      <section class="rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 class="mb-1 text-lg font-semibold text-brand-900">Wardrobe Gap Analysis</h2>
        <p class="mb-4 text-sm text-brand-500">
          Want more out of your wardrobe? Let AI find gaps and suggest what to add.
        </p>

        <!-- Not yet analyzed — show CTA -->
        <div v-if="!gapData && !gapLoading && !gapError"
             class="flex flex-col items-center rounded-lg border-2 border-dashed border-brand-200 py-10">
          <p class="mb-4 text-brand-500">Discover what's missing from your wardrobe</p>
          <button @click="analyzeGaps"
                  class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition">
            Analyze My Wardrobe
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="gapLoading" class="flex flex-col items-center py-10">
          <span class="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p class="text-sm text-brand-500">AI is analyzing your wardrobe...</p>
        </div>

        <!-- Error state -->
        <div v-if="gapError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p class="text-sm text-red-700">Analysis failed. Please try again.</p>
          <button @click="analyzeGaps" class="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
            Try Again
          </button>
        </div>

        <!-- Results -->
        <div v-if="gapData" class="space-y-4">
          <!-- No gaps found -->
          <div v-if="gapData.gaps.length === 0" class="rounded-lg bg-green-50 p-4 text-center">
            <p class="text-green-700 font-medium">Your wardrobe looks well-balanced! 🎉</p>
            <p class="mt-1 text-sm text-green-600">No major gaps detected.</p>
          </div>

          <!-- Detected gaps -->
          <div v-else>
            <div v-for="(gap, idx) in gapData.gaps" :key="idx"
                 class="mb-3 rounded-lg border border-brand-100 bg-brand-50 p-4">
              <div class="mb-2 flex items-center justify-between">
                <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="severityBadge[gap.severity] || 'bg-brand-100 text-brand-700'">
                  {{ gap.severity.toUpperCase() }}
                </span>
                <span class="text-xs font-medium text-brand-500">
                  {{ gapTypeLabels[gap.type] || gap.type }}
                </span>
              </div>
              <p class="text-sm text-brand-800 capitalize">
                {{ gap.type === 'missing_category' ? `No ${gap.detail} items found` :
                   gap.type === 'imbalance' ? `Too many ${gap.detail.replace('too_many_', '')}` :
                   gap.type === 'season_gap' ? `No ${gap.detail} items` :
                   gap.type === 'colour_concentration' ? `${gap.detail} dominates your wardrobe` :
                   gap.detail }}
              </p>

              <!-- AI enrichment for this gap (if available) -->
              <div v-if="gapData.aiRecommendations">
                <div v-for="rec in gapData.aiRecommendations.recommendations.filter(r => r.gap.includes(gap.detail) || r.gap.includes(gap.type))"
                     :key="rec.gap" class="mt-3 border-t border-brand-200 pt-3">
                  <p class="text-sm text-brand-700">{{ rec.suggestion }}</p>
                  <div v-if="rec.specificItems?.length" class="mt-2">
                    <p class="text-xs font-medium text-brand-500">Try adding:</p>
                    <div class="mt-1 flex flex-wrap gap-2">
                      <span v-for="item in rec.specificItems" :key="item"
                            class="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
                        {{ item }}
                      </span>
                    </div>
                  </div>
                  <div v-if="rec.recommendedColours?.length" class="mt-1">
                    <p class="text-xs font-medium text-brand-500">Recommended colours:</p>
                    <p class="text-xs text-brand-600">{{ rec.recommendedColours.join(', ') }}</p>
                  </div>
                  <p v-if="rec.whyItMatters" class="mt-1 text-xs italic text-brand-400">
                    {{ rec.whyItMatters }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Surprise insight & long-term goal (from AI) -->
            <div v-if="gapData.aiRecommendations" class="mt-4 space-y-3 rounded-lg bg-brand-50 p-4 border border-brand-100">
              <div v-if="gapData.aiRecommendations.surpriseInsight">
                <p class="text-xs font-medium text-brand-500 uppercase tracking-wide">Surprise Insight</p>
                <p class="mt-1 text-sm text-brand-700">{{ gapData.aiRecommendations.surpriseInsight }}</p>
              </div>
              <div v-if="gapData.aiRecommendations.longTermGoal">
                <p class="text-xs font-medium text-brand-500 uppercase tracking-wide">Long-Term Goal</p>
                <p class="mt-1 text-sm text-brand-700">{{ gapData.aiRecommendations.longTermGoal }}</p>
              </div>
            </div>

            <!-- Rules-only fallback notice -->
            <div v-if="!gapData.aiRecommendations && gapData.gaps.length > 0"
                 class="rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-600">
              AI suggestions unavailable — showing rule-based analysis.<br>
              <button @click="analyzeGaps" class="font-medium underline">Try AI analysis again</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
