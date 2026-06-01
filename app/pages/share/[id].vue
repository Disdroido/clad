<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

const shared = ref<any>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)

// Compute meta title for social preview
const metaTitle = computed(() => {
  if (!shared.value) return 'Shared Outfit — Clad'
  const sharer = shared.value.sharerProfile?.displayName || 'someone'
  return `${shared.value.outfitName || 'Outfit'} — styled by ${sharer} on Clad`
})

const metaDescription = computed(() => {
  return shared.value?.outfitExplanation || 'Check out this outfit on Clad'
})

const metaImage = computed(() => {
  const firstItem = shared.value?.items?.[0]
  return firstItem?.thumbnailUrl || firstItem?.imageUrl || `${config.public.appUrl}/clad-logo-horizontal.png`
})

useSeoMeta({
  title: metaTitle,
  ogTitle: metaTitle,
  description: metaDescription,
  ogDescription: metaDescription,
  ogImage: metaImage,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

async function fetchShared() {
  loading.value = true
  error.value = ''
  try {
    shared.value = await $fetch(`/api/share/${route.params.id}`)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      error.value = 'This shared outfit isn\'t available.'
    } else {
      error.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API not available — fallback silently
  }
}

onMounted(() => {
  fetchShared()
})
</script>

<template>
  <div class="min-h-screen bg-brand-50">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-brand-500 text-sm">Loading outfit...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="mx-auto max-w-md px-4 py-20 text-center">
      <p class="text-5xl mb-4">👔</p>
      <h1 class="text-xl font-semibold text-brand-900 mb-2">Not Found</h1>
      <p class="text-brand-500">{{ error }}</p>
    </div>

    <!-- Shared outfit content -->
    <div v-else class="mx-auto max-w-2xl px-4 py-8">
      <!-- Header: sharer info -->
      <div class="mb-6 text-center">
        <p class="text-sm text-brand-500 mb-1">
          Styled by
          <NuxtLink
            v-if="shared.sharerProfile"
            :to="`/profile/${shared.sharerProfile.username}`"
            class="font-medium text-brand-700 hover:text-brand-900"
          >
            {{ shared.sharerProfile.displayName }}
          </NuxtLink>
          <span v-else class="text-brand-400">a Clad user</span>
        </p>
        <h1 class="text-2xl font-bold text-brand-950 mt-2">{{ shared.outfitName || 'Outfit' }}</h1>
        <span v-if="shared.outfitOccasion" class="mt-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 capitalize">
          {{ shared.outfitOccasion }}
        </span>
      </div>

      <!-- AI Explanation -->
      <div v-if="shared.outfitExplanation" class="rounded-lg bg-brand-100/50 p-4 mb-6 text-center">
        <p class="text-brand-700 italic">{{ shared.outfitExplanation }}</p>
      </div>

      <!-- Item thumbnails grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div
          v-for="item in shared.items"
          :key="item.id"
          class="overflow-hidden rounded-lg border border-brand-100 bg-white"
        >
          <img
            :src="item.thumbnailUrl || item.imageUrl"
            :alt="item.clothingType"
            class="aspect-square w-full object-cover"
          />
          <div class="p-2 text-center">
            <p class="text-sm font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
            <p class="text-xs text-brand-500">{{ item.colour }}</p>
          </div>
        </div>
      </div>

      <!-- No items fallback -->
      <div v-if="!shared.items?.length" class="text-center py-8 text-brand-400">
        <p>No item details available for this outfit.</p>
      </div>

      <!-- Engagement bar (simple stats + share) -->
      <div class="flex items-center justify-between rounded-lg bg-white p-4 shadow">
        <div class="flex items-center gap-4 text-sm text-brand-500">
          <span>❤️ {{ shared.likeCount || 0 }}</span>
        </div>
        <button
          @click="copyShareLink"
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
        >
          {{ copied ? '✅ Copied!' : '🔗 Share' }}
        </button>
      </div>

      <!-- Clad branding footer -->
      <div class="mt-8 text-center">
        <p class="text-xs text-brand-400">
          Shared via <span class="font-semibold text-brand-500">Clad</span> — AI Wardrobe Assistant
        </p>
      </div>
    </div>
  </div>
</template>
