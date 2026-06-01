<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'My Wardrobe — Clad' })

const route = useRoute()
const activeTab = computed(() => {
  if (route.path.startsWith('/wardrobe/wishlist')) return 'wishlist'
  if (route.path.startsWith('/wardrobe/laundry')) return 'laundry'
  return 'wardrobe'
})

const wardrobeStore = useWardrobeStore()

onMounted(() => wardrobeStore.fetchItems())
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

    <!-- Sub-navigation tabs -->
    <div class="mb-4 flex border-b border-brand-200">
      <NuxtLink
        to="/wardrobe"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'wardrobe' ? 'border-brand-600 text-brand-600' : 'border-transparent text-brand-500 hover:text-brand-600'"
      >
        My Wardrobe
      </NuxtLink>
      <NuxtLink
        to="/wardrobe/wishlist"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'wishlist' ? 'border-brand-600 text-brand-600' : 'border-transparent text-brand-500 hover:text-brand-600'"
      >
        Wishlist
      </NuxtLink>
      <NuxtLink
        to="/wardrobe/laundry"
        class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-brand-500 hover:text-brand-600"
      >
        Laundry
      </NuxtLink>
    </div>

    <div v-if="wardrobeStore.loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div v-else-if="wardrobeStore.items.length === 0" class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <p class="mb-4 text-brand-500">Your wardrobe is empty</p>
      <NuxtLink
        to="/wardrobe/upload"
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
      >
        Add Your First Item
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      <NuxtLink
        v-for="item in wardrobeStore.items"
        :key="item.id"
        :to="`/wardrobe/items/${item.id}`"
        class="overflow-hidden rounded-lg bg-white shadow transition hover:shadow-md hover:-translate-y-0.5"
      >
        <img :src="item.imageUrl" :alt="item.clothingType" class="aspect-square w-full object-cover" />
        <div class="p-3">
          <p class="truncate font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
          <p class="text-sm text-brand-500">{{ item.colour }}</p>
          <p v-if="item.clothingSubType" class="text-xs text-brand-400 capitalize">{{ item.clothingSubType }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
