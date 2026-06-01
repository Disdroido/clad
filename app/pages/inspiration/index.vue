<script setup lang="ts">
import FeedCard from '~/components/FeedCard.vue'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'default' })
useHead({ title: 'Inspiration — Clad' })

const { data: session } = await authClient.useSession(useFetch)
const loggedIn = computed(() => !!session.value?.user)

const items = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Redirect if not logged in
if (!loggedIn.value) {
  await navigateTo('/login')
}

async function fetchInspiration() {
  if (!loggedIn.value) return
  loading.value = true
  error.value = ''
  try {
    const data: any = await $fetch('/api/inspiration')
    items.value = data.items || []
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load saved outfits'
  } finally {
    loading.value = false
  }
}

async function retry() {
  await fetchInspiration()
}

onMounted(() => {
  if (loggedIn.value) {
    fetchInspiration()
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brand-950 mb-6">💡 Inspiration Board</h1>
    <p class="text-sm text-brand-500 mb-6">Your saved outfits from the community. Build your style inspiration collection.</p>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-brand-500 text-sm">Loading your inspiration...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-lg bg-red-50 p-6 text-center">
      <p class="text-sm text-red-700 mb-4">{{ error }}</p>
      <button
        @click="retry"
        class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
      >
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
      <p class="text-4xl mb-4">💡</p>
      <h2 class="text-lg font-semibold text-brand-900 mb-2">No saved outfits yet</h2>
      <p class="text-sm text-brand-500 mb-6">
        Browse the Discover feed to find outfit inspiration from the community. When you find something you like, save it here!
      </p>
      <NuxtLink
        to="/discover"
        class="inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 transition"
      >
        🌍 Browse Discover
      </NuxtLink>
    </div>

    <!-- Saved outfits grid -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <FeedCard
          v-for="item in items"
          :key="item.saveId"
          :outfit="{
            ...item,
            id: item.saveId,
            savedAt: item.savedAt,
          }"
          :show-sharer="true"
        />
      </div>
    </div>
  </div>
</template>
