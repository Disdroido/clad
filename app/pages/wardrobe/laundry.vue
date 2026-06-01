<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'Laundry — Clad' })

const route = useRoute()
const activeTab = computed(() => {
  if (route.path.startsWith('/wardrobe/wishlist')) return 'wishlist'
  if (route.path.startsWith('/wardrobe/laundry')) return 'laundry'
  return 'wardrobe'
})

const wardrobeStore = useWardrobeStore()

const loading = ref(true)
const markAllLoading = ref(false)
const items = ref<any[]>([])

const dirtyItems = computed(() => items.value.filter(item => !item.isClean))

const groupedDirty = computed(() => {
  const dirty = dirtyItems.value
  const groups: Record<string, any[]> = {}
  for (const item of dirty) {
    const type = item.clothingType || 'Other'
    if (!groups[type]) groups[type] = []
    groups[type].push(item)
  }
  return groups
})

function conditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    good: 'Good',
    worn: 'Worn',
    needs_repair: 'Needs Repair',
  }
  return labels[condition] || 'Good'
}

function conditionClass(condition: string): string {
  const classes: Record<string, string> = {
    new: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    worn: 'bg-amber-100 text-amber-700',
    needs_repair: 'bg-red-100 text-red-700',
  }
  return classes[condition] || 'bg-blue-100 text-blue-700'
}

function capitalizeType(type: string): string {
  return type
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function markItemClean(itemId: string) {
  try {
    await $fetch(`/api/wardrobe/items/${itemId}/laundry`, {
      method: 'PATCH',
      body: { isClean: true },
    })
    items.value = items.value.map(i =>
      i.id === itemId ? { ...i, isClean: true } : i
    )
    wardrobeStore.invalidate()
  } catch {
    // silently fail, item stays in list
  }
}

async function markAllClean() {
  markAllLoading.value = true
  try {
    await Promise.all(
      dirtyItems.value.map(item =>
        $fetch(`/api/wardrobe/items/${item.id}/laundry`, {
          method: 'PATCH',
          body: { isClean: true },
        })
      )
    )
    items.value = items.value.map(i => ({ ...i, isClean: true }))
    wardrobeStore.invalidate()
  } catch {
    // silently fail, items stay in list
  } finally {
    markAllLoading.value = false
  }
}

onMounted(async () => {
  await wardrobeStore.fetchItems()
  items.value = wardrobeStore.items
  loading.value = false
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-brand-950">Laundry</h1>
    </div>

    <!-- Sub-navigation tabs (mirror wardrobe/index.vue) -->
    <div class="mb-4 flex border-b border-brand-200">
      <NuxtLink
        to="/wardrobe"
        class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-brand-500 hover:text-brand-600"
      >
        My Wardrobe
      </NuxtLink>
      <NuxtLink
        to="/wardrobe/wishlist"
        class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-brand-500 hover:text-brand-600"
      >
        Wishlist
      </NuxtLink>
      <NuxtLink
        to="/wardrobe/laundry"
        class="px-4 py-2 text-sm font-medium border-b-2 border-brand-600 text-brand-600"
      >
        Laundry
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div v-else-if="dirtyItems.length === 0" class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20">
      <span class="text-4xl mb-4">🧺</span>
      <p class="mb-1 text-lg font-medium text-brand-800">All clean!</p>
      <p class="text-brand-500">No items in the laundry right now.</p>
    </div>

    <template v-else>
      <!-- Mark All Clean button -->
      <button
        @click="markAllClean"
        :disabled="markAllLoading"
        class="w-full rounded-lg bg-green-600 py-3 text-white font-medium hover:bg-green-700 transition mb-6 disabled:opacity-60"
      >
        {{ markAllLoading ? 'Marking...' : '✨ Mark All Clean' }}
      </button>

      <!-- Dirty items grouped by category -->
      <div
        v-for="(groupItems, groupType) in groupedDirty"
        :key="groupType"
        class="mb-6"
      >
        <h2 class="mb-3 text-lg font-semibold text-brand-800 capitalize">
          {{ capitalizeType(groupType) }}s
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="item in groupItems"
            :key="item.id"
            class="overflow-hidden rounded-lg bg-white shadow"
          >
            <NuxtLink :to="`/wardrobe/items/${item.id}`">
              <img
                :src="item.imageUrl"
                :alt="item.clothingType"
                class="aspect-square w-full object-cover"
              />
            </NuxtLink>
            <div class="p-3">
              <p class="truncate font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
              <p class="text-sm text-brand-500">{{ item.colour }}</p>
              <span
                class="text-xs px-1.5 py-0.5 rounded-full inline-block mt-1"
                :class="conditionClass(item.condition)"
              >
                {{ conditionLabel(item.condition) }}
              </span>
              <button
                @click="markItemClean(item.id)"
                class="mt-2 w-full rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
              >
                Mark Clean
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
