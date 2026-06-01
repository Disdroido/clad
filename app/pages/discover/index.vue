<script setup lang="ts">
import FeedCard from '~/components/FeedCard.vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'Discover — Clad' })

const discoverStore = useDiscoverStore()
const sentinel = ref<HTMLElement | null>(null)

async function loadMore() {
  if (discoverStore.loadingMore || !discoverStore.hasMore) return
  await discoverStore.fetchFeed(false)
}

let observer: IntersectionObserver | null = null
onMounted(() => {
  discoverStore.fetchFeed(true)

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && discoverStore.hasMore && !discoverStore.loadingMore) {
      loadMore()
    }
  }, { threshold: 0.1 })

  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brand-950 mb-6">Discover</h1>

    <!-- Loading -->
    <div v-if="discoverStore.loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-brand-500 text-sm">Loading feed...</p>
    </div>

    <!-- Error: handled by store returning empty arrays -->

    <!-- Empty state -->
    <div v-else-if="discoverStore.items.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
      <p class="text-4xl mb-4">👔</p>
      <h2 class="text-lg font-semibold text-brand-900 mb-2">No outfits shared yet</h2>
      <p class="text-sm text-brand-500">Be the first to share an outfit! Create an outfit and tap the Share button.</p>
    </div>

    <!-- Feed grid -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <FeedCard
          v-for="item in discoverStore.items"
          :key="item.id"
          :outfit="item"
          :show-sharer="true"
        />
      </div>

      <!-- Load more sentinel -->
      <div
        v-if="discoverStore.hasMore"
        ref="sentinel"
        class="flex justify-center py-8"
      >
        <span class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>

      <!-- End of feed -->
      <p v-if="!discoverStore.hasMore && discoverStore.items.length > 0" class="text-center py-8 text-sm text-brand-400">
        You're all caught up! 🎉
      </p>
    </div>
  </div>
</template>
