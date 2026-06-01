<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'My Outfits — Clad' })

const outfits = ref<any[]>([])
const loading = ref(true)

async function fetchOutfits() {
  loading.value = true
  try {
    const res = await $fetch('/api/outfits')
    outfits.value = res.outfits
  } catch {
    outfits.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchOutfits)
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

    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div
      v-else-if="outfits.length === 0"
      class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20"
    >
      <p class="mb-4 text-brand-500">No outfits yet</p>
      <NuxtLink
        to="/outfits/generate"
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
      >
        Generate Your First Outfit
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="outfit in outfits"
        :key="outfit.id"
        :to="`/outfits/${outfit.id}`"
        class="block rounded-xl bg-white p-4 shadow-sm border border-brand-100 hover:shadow-md transition"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 capitalize">
            {{ outfit.occasion }}
          </span>
          <span class="text-xs text-brand-400">{{ new Date(outfit.createdAt).toLocaleDateString() }}</span>
        </div>

        <div v-if="outfit.items?.length" class="mb-3 flex gap-2 overflow-x-auto pb-1">
          <img
            v-for="item in outfit.items"
            :key="item.id"
            :src="item.imageUrl"
            :alt="item.clothingType"
            class="h-20 w-20 flex-shrink-0 rounded-lg border border-brand-100 object-cover"
          />
        </div>

        <p class="text-sm text-brand-600 italic">{{ outfit.explanation }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
