<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'My Wardrobe — Clad'
})

const items = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await $fetch<{ items: any[] }>('/api/wardrobe/items')
    items.value = data.items
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand-950">My Wardrobe</h1>
      <NuxtLink
        to="/wardrobe/upload"
        class="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition"
      >
        + Add Item
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="text-brand-500">Loading...</span>
    </div>

    <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <p class="mb-4 text-brand-500">Your wardrobe is empty</p>
      <NuxtLink
        to="/wardrobe/upload"
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
      >
        Add Your First Item
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="overflow-hidden rounded-lg bg-white shadow transition hover:shadow-md"
      >
        <img :src="item.imageUrl" :alt="item.clothingType" class="aspect-square w-full object-cover" />
        <div class="p-3">
          <p class="font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
          <p class="text-sm text-brand-500">{{ item.colour }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
