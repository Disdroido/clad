<script setup lang="ts">
const props = defineProps<{
  outfit: {
    id?: string
    shortId: string
    outfitName?: string
    outfitOccasion?: string
    outfitItemIds?: string[]
    sharerUsername?: string
    sharerDisplayName?: string
    likeCount?: number
    savedAt?: string
  }
  showSharer?: boolean
}>()

const itemThumbs = computed(() => (props.outfit.outfitItemIds || []).slice(0, 4))
const gridClass = computed(() => {
  const count = itemThumbs.value.length
  if (count === 0) return 'grid-cols-1'
  if (count === 1) return 'grid-cols-1'
  return 'grid-cols-2'
})
</script>

<template>
  <NuxtLink
    :to="`/share/${outfit.shortId}`"
    class="group block rounded-xl bg-white p-3 shadow hover:shadow-md transition cursor-pointer"
  >
    <!-- Thumbnail grid -->
    <div
      class="grid gap-1 rounded-lg overflow-hidden mb-3 aspect-square bg-brand-100"
      :class="gridClass"
    >
      <div
        v-for="(_, idx) in itemThumbs"
        :key="idx"
        class="bg-brand-100 flex items-center justify-center text-2xl"
      >
        👔
      </div>
      <div
        v-if="itemThumbs.length === 0"
        class="flex items-center justify-center text-3xl text-brand-300"
      >
        👔
      </div>
    </div>

    <!-- Meta -->
    <p class="text-sm font-medium text-brand-900 truncate">{{ outfit.outfitName || 'Outfit' }}</p>

    <div v-if="showSharer && outfit.sharerDisplayName" class="mt-1">
      <NuxtLink
        :to="`/profile/${outfit.sharerUsername}`"
        class="text-xs text-brand-500 hover:text-brand-700"
        @click.stop
      >
        {{ outfit.sharerDisplayName }}
      </NuxtLink>
    </div>

    <div class="flex items-center gap-2 mt-1.5 text-xs text-brand-400">
      <span v-if="outfit.likeCount !== undefined">❤️ {{ outfit.likeCount }}</span>
      <span v-if="outfit.savedAt" class="text-brand-300">
        Saved {{ new Date(outfit.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
      </span>
    </div>
  </NuxtLink>
</template>
