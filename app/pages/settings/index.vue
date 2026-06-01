<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'default' })
useHead({ title: 'Settings — Clad' })

const { data: session } = await authClient.useSession(useFetch)

async function signOut() {
  await authClient.signOut()
  await navigateTo('/login')
}

// Public profile state
const publicProfile = ref({ username: '', displayName: '', bio: '', isPublic: false })
const profileLoading = ref(true)
const profileSaving = ref(false)
const profileError = ref('')
const profileSuccess = ref(false)

async function fetchPublicProfile() {
  profileLoading.value = true
  try {
    const data: any = await $fetch('/api/profile/public')
    if (data) {
      publicProfile.value = {
        username: data.username || '',
        displayName: data.displayName || '',
        bio: data.bio || '',
        isPublic: data.isPublic || false,
      }
    }
  } catch {
    // No profile yet — use defaults
  } finally {
    profileLoading.value = false
  }
}

async function savePublicProfile() {
  profileSaving.value = true
  profileError.value = ''
  profileSuccess.value = false
  try {
    const result = await $fetch('/api/profile/public', {
      method: 'PATCH',
      body: {
        username: publicProfile.value.username,
        displayName: publicProfile.value.displayName || session.value?.user?.name || 'User',
        bio: publicProfile.value.bio || null,
        isPublic: publicProfile.value.isPublic,
      },
    })
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  } catch (err: any) {
    profileError.value = err?.data?.message || 'Failed to save profile'
  } finally {
    profileSaving.value = false
  }
}

onMounted(() => {
  if (session.value) {
    fetchPublicProfile()
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brand-950 mb-6">Settings</h1>

    <div v-if="session" class="mb-6 rounded-lg bg-white p-4 shadow">
      <p class="text-sm text-brand-500">Signed in as</p>
      <p class="font-medium text-brand-900">{{ session.user.name }}</p>
      <p class="text-sm text-brand-600">{{ session.user.email }}</p>
    </div>

    <div v-if="session && !profileLoading" class="rounded-lg bg-white p-4 shadow mb-6">
      <h2 class="font-semibold text-brand-900 mb-3">Public Profile</h2>

      <!-- Toggle -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm font-medium text-brand-700">Enable Public Profile</p>
          <p class="text-xs text-brand-500">Let others discover your shared outfits</p>
        </div>
        <button
          @click="publicProfile.isPublic = !publicProfile.isPublic"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition"
          :class="publicProfile.isPublic ? 'bg-brand-600' : 'bg-brand-300'"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white transition transform"
            :class="publicProfile.isPublic ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>

      <!-- Username -->
      <div class="mb-3">
        <label class="mb-1 block text-xs font-medium text-brand-700">Username</label>
        <input
          v-model="publicProfile.username"
          :disabled="!publicProfile.isPublic"
          placeholder="your_username"
          maxlength="30"
          class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
        />
        <p class="text-xs text-brand-400 mt-1">3-30 characters. Letters, numbers, underscores, hyphens. Your profile will be at /profile/<strong>your_username</strong>.</p>
      </div>

      <!-- Display Name -->
      <div class="mb-3">
        <label class="mb-1 block text-xs font-medium text-brand-700">Display Name</label>
        <input
          v-model="publicProfile.displayName"
          :disabled="!publicProfile.isPublic"
          :placeholder="session?.user?.name || 'Your name'"
          maxlength="100"
          class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
        />
      </div>

      <!-- Bio -->
      <div class="mb-4">
        <label class="mb-1 block text-xs font-medium text-brand-700">Bio (optional)</label>
        <textarea
          v-model="publicProfile.bio"
          :disabled="!publicProfile.isPublic"
          placeholder="A short bio about your style..."
          maxlength="500"
          rows="2"
          class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
        />
        <p class="text-xs text-brand-400 mt-1">{{ (publicProfile.bio || '').length }}/500</p>
      </div>

      <!-- Error / Success -->
      <p v-if="profileError" class="mb-3 text-sm text-red-600">{{ profileError }}</p>
      <p v-if="profileSuccess" class="mb-3 text-sm text-green-600">✅ Profile saved!</p>

      <!-- Save -->
      <button
        @click="savePublicProfile"
        :disabled="profileSaving"
        class="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
      >
        {{ profileSaving ? 'Saving...' : 'Save Public Profile' }}
      </button>
    </div>

    <div class="space-y-4">
      <NuxtLink to="/settings/archive" class="flex items-center justify-between rounded-lg bg-white p-4 shadow hover:shadow-md transition">
        <div>
          <p class="font-medium text-brand-900">Archive</p>
          <p class="text-sm text-brand-500">View and manage archived outfits and clothing</p>
        </div>
        <span class="text-brand-400">→</span>
      </NuxtLink>

      <NuxtLink to="/onboarding" class="flex items-center justify-between rounded-lg bg-white p-4 shadow hover:shadow-md transition">
        <div>
          <p class="font-medium text-brand-900">Edit Profile</p>
          <p class="text-sm text-brand-500">Style preferences, body type, goals</p>
        </div>
        <span class="text-brand-400">→</span>
      </NuxtLink>

      <div class="rounded-lg bg-white p-4 shadow">
        <p class="font-medium text-brand-900 mb-1">Export Data</p>
        <p class="text-sm text-brand-500 mb-3">Download all your wardrobe and outfit data</p>
        <button class="rounded border border-brand-300 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">
          Export as JSON
        </button>
      </div>

      <button
        @click="signOut"
        class="w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 transition"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
