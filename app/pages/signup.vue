<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'default' })
useHead({ title: 'Create your account — Clad' })

const route = useRoute()
const nextPath = (route.query.next as string) || '/onboarding'

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (loading.value) return
  error.value = null
  loading.value = true
  try {
    const { error: err } = await authClient.signUp.email({
      email: email.value.trim(),
      password: password.value,
      name: name.value.trim(),
    })
    if (err) {
      error.value = err.message || 'Could not create account.'
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
    <h1 class="text-3xl font-bold text-brand-950">Create your account</h1>
    <p class="mt-1 text-brand-500">It takes about ten seconds.</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-brand-700 mb-1">Name</label>
        <input
          v-model="name"
          type="text"
          required
          autocomplete="name"
          class="w-full rounded-lg border border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
        />
      </div>
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
          minlength="8"
          autocomplete="new-password"
          class="w-full rounded-lg border border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
        />
        <p class="mt-1 text-xs text-brand-500">At least 8 characters.</p>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-brand-600">
      Already have an account?
      <NuxtLink :to="`/login?next=${encodeURIComponent(nextPath)}`" class="font-medium text-brand-800 underline">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
