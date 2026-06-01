<script setup lang="ts">
defineProps<{
  temperature?: number
  feelsLike?: number
  condition?: string
  iconUrl?: string
  locationName?: string
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
    v-else-if="temperature !== undefined"
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
