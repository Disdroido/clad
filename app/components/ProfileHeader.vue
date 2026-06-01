<script setup lang="ts">
import FollowButton from './FollowButton.vue'

const props = defineProps<{
  profile: {
    username: string
    displayName: string
    bio?: string
    sharedCount: number
    viewerFollowing: boolean
  }
  loggedIn: boolean
}>()

const emit = defineEmits<{
  followToggled: [following: boolean]
}>()
</script>

<template>
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
    <div class="mt-4">
      <FollowButton
        v-if="loggedIn"
        :username="profile.username"
        :initial-following="profile.viewerFollowing"
        :logged-in="loggedIn"
        @toggled="emit('followToggled', $event)"
      />
    </div>
  </div>
</template>
