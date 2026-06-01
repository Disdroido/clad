<script setup lang="ts">
const tripStore = useTripStore()

const emit = defineEmits<{
  schedule: []
}>()

onMounted(() => tripStore.fetchTrips())

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
  <div class="rounded-xl bg-white p-5 shadow-sm border border-brand-100">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-semibold text-brand-900">Trips</h2>
      <NuxtLink to="/trips/new"
                class="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 transition">
        + New
      </NuxtLink>
    </div>

    <div v-if="tripStore.loading" class="py-6 text-center text-sm text-brand-400">Loading...</div>

    <div v-else-if="tripStore.trips.length === 0" class="py-6 text-center">
      <p class="text-sm text-brand-400">No trips planned yet</p>
    </div>

    <div v-else class="space-y-1.5">
      <NuxtLink v-for="trip in tripStore.trips" :key="trip.id"
                :to="`/trips/${trip.id}`"
                class="block rounded-lg border border-brand-100 p-2.5 hover:border-brand-300 hover:bg-brand-50 transition">
        <div class="flex items-center gap-2.5">
          <span class="text-base flex-shrink-0">{{ getPurposeEmoji(trip.purpose) }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-brand-900">{{ trip.name }}</p>
            <p class="truncate text-xs text-brand-400">{{ trip.destination }} · {{ formatDateRange(trip.startDate, trip.endDate) }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
