<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'What I Wore — Clad' })

const events = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
const limit = 20
const offset = ref(0)
const loadingMore = ref(false)

async function fetchHistory(append = false) {
  if (append) loadingMore.value = true
  else loading.value = true
  try {
    const res = await $fetch('/api/outfits/wear-history', {
      params: { limit, offset: offset.value }
    })
    if (append) {
      events.value = [...events.value, ...res.events]
    } else {
      events.value = res.events
    }
    total.value = res.total
  } catch {
    if (!append) events.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  offset.value += limit
  fetchHistory(true)
}

const groupedEvents = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const event of events.value) {
    const date = new Date(event.wornDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(event)
  }
  return Object.entries(groups).map(([date, events]) => ({ date, events }))
})

onMounted(() => fetchHistory(false))
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brand-950 mb-6">What I Wore</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div
      v-else-if="events.length === 0"
      class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20"
    >
      <p class="mb-4 text-brand-500">No wear history yet. Start logging outfits you wear!</p>
      <NuxtLink
        to="/outfits"
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
      >
        Browse Outfits
      </NuxtLink>
    </div>

    <div v-else>
      <div v-for="(group, idx) in groupedEvents" :key="idx" class="mb-6">
        <h2 class="text-sm font-semibold text-brand-400 mb-3 uppercase tracking-wide">{{ group.date }}</h2>
        <div v-for="event in group.events" :key="event.id" class="mb-3">
          <NuxtLink
            :to="'/outfits/' + event.outfitId"
            class="block rounded-xl bg-white p-4 shadow-sm border border-brand-100 hover:shadow-md transition"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 capitalize">
                {{ event.outfit.occasion }}
              </span>
              <span v-if="event.rating" class="text-sm">⭐ {{ event.rating }}/5</span>
            </div>
            <p class="text-sm text-brand-600 italic mb-2">{{ event.outfit.explanation }}</p>
            <div v-if="event.outfit.items?.length" class="flex gap-2 overflow-x-auto">
              <img
                v-for="item in event.outfit.items"
                :key="item.id"
                :src="item.imageUrl"
                :alt="item.clothingType"
                class="h-16 w-16 flex-shrink-0 rounded-lg border border-brand-100 object-cover"
              />
            </div>
            <p v-if="event.notes" class="text-xs text-brand-400 mt-2">{{ event.notes }}</p>
          </NuxtLink>
        </div>
      </div>

      <button
        v-if="events.length < total"
        @click="loadMore"
        :disabled="loadingMore"
        class="w-full rounded-lg border border-brand-300 py-3 text-brand-700 hover:bg-brand-50 transition disabled:opacity-50"
      >
        {{ loadingMore ? 'Loading...' : 'Load More (' + (total - events.length) + ' remaining)' }}
      </button>
    </div>
  </div>
</template>
