<script setup lang="ts">
import ProfileHeader from '~/components/ProfileHeader.vue'
import FeedCard from '~/components/FeedCard.vue'
import { authClient } from '~/lib/auth-client'

const route = useRoute()

const { data: session } = await authClient.useSession(useFetch)
const loggedIn = computed(() => !!session.value?.user)

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
      <ProfileHeader
        :profile="{
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
          sharedCount: profile.sharedCount,
          viewerFollowing: profile.viewerFollowing || false,
        }"
        :logged-in="loggedIn"
        @follow-toggled="(following: boolean) => profile.viewerFollowing = following"
      />

      <!-- Outfit gallery -->
      <div v-if="profile.outfits?.length > 0">
        <h2 class="text-lg font-semibold text-brand-900 mb-4">Shared Outfits</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <FeedCard
            v-for="outfit in profile.outfits"
            :key="outfit.id"
            :outfit="outfit"
          />
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
