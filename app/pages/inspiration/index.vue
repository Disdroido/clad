<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Inspiration — Clad' })

const inspirationStore = useInspirationStore()

onMounted(() => inspirationStore.fetchInspiration())

useHead({ title: 'Inspiration — Clad' })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brand-950 mb-6">Inspiration</h1>

    <div v-if="inspirationStore.loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div v-else-if="inspirationStore.items.length === 0"
         class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <p class="mb-2 text-lg font-medium text-brand-600">Save outfits for inspiration</p>
      <p class="mb-4 text-sm text-brand-400">Browse Discover and save outfits you love</p>
      <NuxtLink to="/discover"
                class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition">
        Browse Discover
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <FeedCard
        v-for="item in inspirationStore.items"
        :key="item.id"
        :outfit="item"
        :show-sharer="true"
      />
    </div>
  </div>
</template>
