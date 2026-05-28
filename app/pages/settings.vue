<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Settings — Clad' })
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold text-brand-950 mb-6">Settings</h1>

    <div class="space-y-4">
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
    </div>
  </div>
</template>
