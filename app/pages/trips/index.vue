<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Trips — Clad' })

const tripStore = useTripStore()

onMounted(() => tripStore.fetchTrips())
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand-950">Trips</h1>
      <NuxtLink to="/trips/new"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition">
        + New Trip
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="tripStore.loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Empty state -->
    <div v-else-if="tripStore.trips.length === 0"
         class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <p class="mb-2 text-lg font-medium text-brand-600">Plan your first trip</p>
      <p class="mb-4 text-sm text-brand-400">Create a trip and we'll help you pack</p>
      <NuxtLink to="/trips/new"
                class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition">
        + New Trip
      </NuxtLink>
    </div>

    <!-- Trip grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TripCard v-for="trip in tripStore.trips" :key="trip.id" :trip="trip" />
    </div>
  </div>
</template>
