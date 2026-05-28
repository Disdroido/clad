<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'My Outfits — Clad' })
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand-950">My Outfits</h1>
      <NuxtLink
        to="/outfits/generate"
        class="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition"
      >
        + Generate
      </NuxtLink>
    </div>

    <div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <p class="mb-4 text-brand-500">No outfits yet</p>
      <NuxtLink
        to="/outfits/generate"
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
      >
        Generate Your First Outfit
      </NuxtLink>
    </div>
  </div>
</template>
