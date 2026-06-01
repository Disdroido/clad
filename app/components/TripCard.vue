<script setup lang="ts">
interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  purpose: string
}

defineProps<{
  trip: Trip
}>()

const purposeEmoji: Record<string, string> = {
  vacation: '🏖️', business: '💼', adventure: '🏔️',
  city: '🌆', family: '👪', event: '🎉',
}

function getPurposeEmoji(purpose: string) {
  return purposeEmoji[purpose.toLowerCase()] || '✈️'
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${s} — ${e}`
}
</script>

<template>
  <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div class="mb-2 flex items-start justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">{{ getPurposeEmoji(trip.purpose) }}</span>
        <h3 class="text-base font-semibold text-brand-900">{{ trip.name }}</h3>
      </div>
      <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs capitalize text-brand-700">
        {{ trip.purpose }}
      </span>
    </div>
    <p class="mb-1 text-sm text-brand-600">{{ trip.destination }}</p>
    <p class="mb-3 text-xs text-brand-400">{{ formatDateRange(trip.startDate, trip.endDate) }}</p>
    <NuxtLink :to="`/trips/${trip.id}`"
              class="inline-block rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 transition">
      View → 🧳
    </NuxtLink>
  </div>
</template>
