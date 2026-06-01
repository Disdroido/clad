<script setup lang="ts">
interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  purpose: string
}

const trips = ref<Trip[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    trips.value = await $fetch('/api/trips')
  } catch {
    trips.value = []
  } finally {
    loading.value = false
  }
})

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${s} — ${e}`
}

const purposeEmoji: Record<string, string> = {
  vacation: '🏖️', business: '💼', adventure: '🏔️', city: '🌆', family: '👪', event: '🎉',
}
function getPurposeEmoji(purpose: string) {
  return purposeEmoji[purpose.toLowerCase()] || '✈️'
}
</script>

<template>
  <div class="rounded-xl bg-white p-6 shadow-sm border border-brand-100">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-semibold text-brand-900">✈️ Trips</h2>
      <NuxtLink to="/trips/new"
                class="rounded-lg border border-brand-300 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition">
        + New Trip
      </NuxtLink>
    </div>

    <div v-if="loading" class="py-4 text-center text-sm text-brand-400">Loading...</div>

    <div v-else-if="trips.length === 0" class="py-4 text-center">
      <p class="text-sm text-brand-400">Plan your first trip</p>
    </div>

    <div v-else class="space-y-2">
      <NuxtLink v-for="trip in trips" :key="trip.id"
                :to="`/trips/${trip.id}`"
                class="block rounded-lg border border-brand-100 bg-brand-50 p-3 hover:border-brand-300 transition">
        <div class="flex items-center gap-2">
          <span>{{ getPurposeEmoji(trip.purpose) }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-brand-900">{{ trip.name }}</p>
            <p class="truncate text-xs text-brand-500">{{ trip.destination }}</p>
            <p class="text-xs text-brand-400">{{ formatDateRange(trip.startDate, trip.endDate) }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
