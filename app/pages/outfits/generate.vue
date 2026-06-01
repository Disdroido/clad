<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Generate Outfit — Clad'
})

const router = useRouter()

const occasions = [
  { id: 'casual', label: 'Casual', icon: '👕', desc: 'Everyday errands, hanging out' },
  { id: 'work', label: 'Work', icon: '💼', desc: 'Office or professional setting' },
  { id: 'date', label: 'Date Night', icon: '🌹', desc: 'Romantic dinner or drinks' },
  { id: 'formal', label: 'Formal', icon: '✨', desc: 'Wedding, gala, special event' },
  { id: 'active', label: 'Active', icon: '🏃', desc: 'Gym, workout, outdoor activity' },
]

const selectedOccasion = ref<string | null>(null)

// Weather state
const weather = ref<{
  temperature: number
  condition: string
  iconUrl: string
  locationName: string
  feelsLike: number
} | null>(null)
const weatherLoading = ref(true)
const coords = ref<{ lat: number; lon: number } | null>(null)

onMounted(async () => {
  // Get location from browser (cached or fresh)
  const { requestLocation } = useGeolocation()
  const location = await requestLocation()
  coords.value = location

  if (location) {
    // Fetch weather for the badge display (non-blocking per D-05)
    try {
      weather.value = await $fetch('/api/weather/current', {
        params: { lat: location.lat, lon: location.lon },
      })
    } catch {
      weather.value = null
    }
  }
  weatherLoading.value = false
})

function generateOutfit() {
  if (!selectedOccasion.value) return
  const query: Record<string, string> = { occasion: selectedOccasion.value }
  if (coords.value) {
    query.lat = String(coords.value.lat)
    query.lon = String(coords.value.lon)
  }
  router.push({ path: '/outfits/result', query })
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brand-950 mb-2">Pick My Outfit</h1>
    <p class="text-brand-500 mb-6">What's the occasion?</p>

    <!-- Weather badge (D-04: near occasion selector) -->
    <div class="mb-6">
      <WeatherBadge
        :temperature="weather?.temperature"
        :condition="weather?.condition"
        :icon-url="weather?.iconUrl"
        :location-name="weather?.locationName"
        :loading="weatherLoading"
      />
    </div>

    <!-- Occasion picker -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <button
        v-for="occ in occasions"
        :key="occ.id"
        @click="selectedOccasion = occ.id"
        :class="[
          'rounded-xl border-2 p-4 text-left transition hover:shadow-md',
          selectedOccasion === occ.id
            ? 'border-brand-600 bg-brand-50'
            : 'border-brand-200 bg-white hover:border-brand-300'
        ]"
      >
        <div class="text-2xl mb-1">{{ occ.icon }}</div>
        <p class="font-medium text-brand-900">{{ occ.label }}</p>
        <p class="text-sm text-brand-500">{{ occ.desc }}</p>
      </button>
    </div>

    <!-- Generate button -->
    <button
      @click="generateOutfit"
      :disabled="!selectedOccasion"
      class="w-full rounded-lg bg-brand-600 py-4 text-lg font-medium text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ✨ Pick My Outfit
    </button>

  </div>
</template>
