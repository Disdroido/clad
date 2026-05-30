<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'default' })
useHead({ title: 'Sign in — Clad' })

const route = useRoute()
const nextPath = (route.query.next as string) || '/wardrobe'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (loading.value) return
  error.value = null
  loading.value = true
  try {
    const { error: err } = await authClient.signIn.email({
      email: email.value.trim(),
      password: password.value,
    })
    if (err) {
      error.value = err.message || 'Invalid email or password.'
      return
    }
    await navigateTo(nextPath)
  }
  catch (e: any) {
    error.value = e?.message ?? 'Something went wrong.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto mt-12 max-w-sm">
    <h1 class="text-3xl font-bold text-brand-950">Welcome back</h1>
    <p class="mt-1 text-brand-500">Sign in to your Clad wardrobe.</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-brand-700 mb-1">Email</label>
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="w-full rounded-lg border border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-brand-700 mb-1">Password</label>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full rounded-lg border border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-brand-600">
      New to Clad?
      <NuxtLink :to="`/signup?next=${encodeURIComponent(nextPath)}`" class="font-medium text-brand-800 underline">
        Create an account
      </NuxtLink>
    </p>
  </div>
</template>
