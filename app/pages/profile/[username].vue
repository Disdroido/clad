<script setup lang="ts">
const route = useRoute()

const profile = ref<any>(null)
const loading = ref(true)
const error = ref('')

definePageMeta({ layout: 'default' })
useHead({
  title: computed(() => {
    if (!profile.value) return 'Profile — Clad'
    return `${profile.value.displayName} (@${profile.value.username}) — Clad`
  }),
})

async function fetchProfile() {
  loading.value = true
  error.value = ''
  try {
    profile.value = await $fetch(`/api/profile/public/${route.params.username}`)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      error.value = 'Profile not found or is private'
    } else {
      error.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="mx-auto max-w-md py-20 text-center">
      <p class="text-5xl mb-4">👤</p>
      <h1 class="text-xl font-semibold text-brand-900 mb-2">Profile Not Found</h1>
      <p class="text-brand-500">{{ error }}</p>
    </div>

    <!-- Profile content -->
    <div v-else class="mx-auto max-w-3xl">
      <!-- Profile header -->
      <div class="rounded-xl bg-white p-6 shadow mb-6 text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-100 text-3xl mb-4">
          👤
        </div>
        <h1 class="text-xl font-bold text-brand-950">{{ profile.displayName }}</h1>
        <p class="text-sm text-brand-500">@{{ profile.username }}</p>
        <p v-if="profile.bio" class="mt-3 text-sm text-brand-700 max-w-md mx-auto">{{ profile.bio }}</p>
        <p class="mt-4 text-sm text-brand-500">
          <span class="font-semibold text-brand-700">{{ profile.sharedCount }}</span> shared outfits
        </p>
      </div>

      <!-- Outfit gallery -->
      <div v-if="profile.outfits?.length > 0">
        <h2 class="text-lg font-semibold text-brand-900 mb-4">Shared Outfits</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="outfit in profile.outfits"
            :key="outfit.id"
            :to="`/share/${outfit.shortId}`"
            class="group rounded-xl bg-white p-3 shadow hover:shadow-md transition"
          >
            <div class="grid grid-cols-2 gap-1 rounded-lg overflow-hidden mb-3 aspect-square bg-brand-100">
              <template v-for="(itemId, idx) in ((outfit.outfitItemIds as string[]) || []).slice(0, 4)" :key="idx">
                <div class="bg-brand-100 flex items-center justify-center text-2xl">
                  👔
                </div>
              </template>
            </div>
            <p class="text-sm font-medium text-brand-900 truncate">{{ outfit.outfitName || 'Outfit' }}</p>
            <span class="text-xs text-brand-500 capitalize">{{ outfit.outfitOccasion }}</span>
            <div class="flex items-center gap-1 mt-1 text-xs text-brand-400">
              <span>❤️ {{ outfit.likeCount || 0 }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Empty gallery -->
      <div v-else class="rounded-lg bg-white p-12 text-center shadow">
        <p class="text-4xl mb-4">📸</p>
        <h2 class="text-lg font-semibold text-brand-900 mb-2">No outfits shared yet</h2>
        <p class="text-sm text-brand-500">{{ profile.displayName }} hasn't shared any outfits.</p>
      </div>
    </div>
  </div>
</template>
