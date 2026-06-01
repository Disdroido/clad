<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Discover — Clad' })

const items = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const offset = ref(0)
const hasMore = ref(true)
const error = ref('')
const sentinel = ref<HTMLElement | null>(null)
const limit = 20

async function fetchFeed(isInitial = false) {
  if (isInitial) {
    loading.value = true
    offset.value = 0
  } else {
    loadingMore.value = true
  }

  error.value = ''
  try {
    const res: any = await $fetch('/api/discover', {
      params: { limit, offset: offset.value },
    })

    if (isInitial) {
      items.value = res.items || []
    } else {
      items.value.push(...(res.items || []))
    }

    hasMore.value = (res.items || []).length >= limit
    offset.value += limit
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load feed'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  await fetchFeed(false)
}

// IntersectionObserver for infinite scroll
let observer: IntersectionObserver | null = null
onMounted(() => {
  fetchFeed(true)

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
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
    <h1 class="text-2xl font-bold text-brand-950 mb-6">🌍 Discover</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-brand-500 text-sm">Loading feed...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error && items.length === 0" class="rounded-lg bg-red-50 p-4 text-center">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
      <p class="text-4xl mb-4">👔</p>
      <h2 class="text-lg font-semibold text-brand-900 mb-2">No outfits shared yet</h2>
      <p class="text-sm text-brand-500">Be the first to share an outfit! Create an outfit and tap the Share button.</p>
    </div>

    <!-- Feed grid -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/share/${item.shortId}`"
          class="group rounded-xl bg-white p-3 shadow hover:shadow-md transition cursor-pointer"
        >
          <!-- Item thumbnails (2x2 mini grid) -->
          <div class="grid grid-cols-2 gap-1 rounded-lg overflow-hidden mb-3 aspect-square bg-brand-100">
            <template v-for="(itemId, idx) in ((item.outfitItemIds as string[]) || []).slice(0, 4)" :key="idx">
              <div class="bg-brand-100 flex items-center justify-center text-2xl">
                👔
              </div>
            </template>
          </div>

          <p class="text-sm font-medium text-brand-900 truncate">{{ item.outfitName || 'Outfit' }}</p>
          <NuxtLink
            v-if="item.sharerDisplayName"
            :to="`/profile/${item.sharerUsername}`"
            class="text-xs text-brand-500 hover:text-brand-700"
            @click.stop
          >
            {{ item.sharerDisplayName }}
          </NuxtLink>
          <div class="flex items-center gap-1 mt-1 text-xs text-brand-400">
            <span>❤️ {{ item.likeCount || 0 }}</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Load more sentinel -->
      <div
        v-if="hasMore"
        ref="sentinel"
        class="flex justify-center py-8"
      >
        <span class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>

      <!-- End of feed -->
      <p v-if="!hasMore && items.length > 0" class="text-center py-8 text-sm text-brand-400">
        You're all caught up! 🎉
      </p>
    </div>
  </div>
</template>
