<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Archive — Clad' })

const activeTab = ref<'outfits' | 'items'>('outfits')
const outfits = ref<any[]>([])
const items = ref<any[]>([])
const loading = ref(false)
const selected = ref<Set<string>>(new Set())

async function fetchArchived() {
  loading.value = true
  try {
    const [outfitsRes, itemsRes] = await Promise.all([
      $fetch<{ outfits: any[] }>('/api/archive/outfits'),
      $fetch<{ items: any[] }>('/api/archive/items'),
    ])
    outfits.value = outfitsRes.outfits
    items.value = itemsRes.items
  } catch {
    outfits.value = []
    items.value = []
  } finally {
    loading.value = false
  }
}

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id) else next.add(id)
  selected.value = next
}

function toggleAll() {
  const list = activeTab.value === 'outfits' ? outfits.value : items.value
  if (selected.value.size === list.length) {
    selected.value = new Set()
  } else {
    selected.value = new Set(list.map((i: any) => i.id))
  }
}

async function restoreSelected() {
  if (selected.value.size === 0) return
  const list = activeTab.value === 'outfits' ? outfits.value : items.value
  const endpoint = activeTab.value === 'outfits' ? '/api/outfits' : '/api/wardrobe/items'

  for (const id of selected.value) {
    try {
      await $fetch(`${endpoint}/${id}/archive`, {
        method: 'PATCH',
        body: { isArchived: false },
      })
    } catch { /* skip */ }
  }

  selected.value = new Set()
  await fetchArchived()
}

async function deleteSelected() {
  if (selected.value.size === 0) return
  const label = activeTab.value === 'outfits' ? 'outfits' : 'items'
  if (!confirm(`Permanently delete ${selected.value.size} ${label}? This cannot be undone.`)) return

  const endpoint = activeTab.value === 'outfits' ? '/api/archive/outfits' : '/api/archive/items'

  try {
    await $fetch(endpoint, {
      method: 'DELETE',
      body: { ids: Array.from(selected.value) },
    })
  } catch { /* ignore */ }

  selected.value = new Set()
  await fetchArchived()
}

onMounted(fetchArchived)
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-4">
      <NuxtLink to="/settings" class="text-sm text-brand-400 hover:text-brand-600">&larr; Settings</NuxtLink>
    </div>

    <h1 class="text-2xl font-bold text-brand-950 mb-6">Archive</h1>

    <!-- Tabs -->
    <div class="mb-6 flex gap-1 rounded-lg bg-brand-100 p-1">
      <button
        @click="activeTab = 'outfits'; selected = new Set()"
        class="flex-1 rounded-md py-2 text-sm font-medium transition"
        :class="activeTab === 'outfits' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-800'"
      >
        Outfits ({{ outfits.length }})
      </button>
      <button
        @click="activeTab = 'items'; selected = new Set()"
        class="flex-1 rounded-md py-2 text-sm font-medium transition"
        :class="activeTab === 'items' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-800'"
      >
        Clothing ({{ items.length }})
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="(activeTab === 'outfits' ? outfits : items).length === 0"
      class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20"
    >
      <p class="text-brand-500">No archived {{ activeTab === 'outfits' ? 'outfits' : 'clothing' }}</p>
    </div>

    <!-- List -->
    <div v-else>
      <!-- Select all toolbar -->
      <div class="mb-4 flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-brand-600 cursor-pointer">
          <input
            type="checkbox"
            :checked="selected.size === (activeTab === 'outfits' ? outfits : items).length"
            :indeterminate="selected.size > 0 && selected.size < (activeTab === 'outfits' ? outfits : items).length"
            @change="toggleAll"
            class="h-4 w-4 rounded border-brand-300 text-brand-600"
          />
          Select all
        </label>
        <div class="flex gap-2">
          <button
            v-if="selected.size > 0"
            @click="restoreSelected"
            class="rounded-lg border border-brand-300 px-4 py-1.5 text-sm text-brand-700 hover:bg-brand-50 transition"
          >
            Restore ({{ selected.size }})
          </button>
          <button
            v-if="selected.size > 0"
            @click="deleteSelected"
            class="rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700 transition"
          >
            Delete ({{ selected.size }})
          </button>
        </div>
      </div>

      <!-- Outfits grid -->
      <div v-if="activeTab === 'outfits'" class="space-y-3">
        <div
          v-for="outfit in outfits"
          :key="outfit.id"
          class="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm border border-brand-100"
        >
          <input
            type="checkbox"
            :checked="selected.has(outfit.id)"
            @change="toggle(outfit.id)"
            class="h-5 w-5 rounded border-brand-300 text-brand-600"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 capitalize">
                {{ outfit.occasion }}
              </span>
              <span class="text-xs text-brand-400">{{ new Date(outfit.createdAt).toLocaleDateString() }}</span>
            </div>
            <p class="text-sm text-brand-600 truncate">{{ outfit.explanation }}</p>
            <div v-if="outfit.items?.length" class="mt-2 flex gap-1">
              <img
                v-for="item in outfit.items.slice(0, 4)"
                :key="item.id"
                :src="item.imageUrl"
                :alt="item.clothingType"
                class="h-10 w-10 rounded border border-brand-100 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Items grid -->
      <div v-if="activeTab === 'items'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="relative overflow-hidden rounded-lg border border-brand-100 bg-white"
        >
          <input
            type="checkbox"
            :checked="selected.has(item.id)"
            @change="toggle(item.id)"
            class="absolute left-2 top-2 z-10 h-5 w-5 rounded border-brand-300 text-brand-600"
          />
          <img :src="item.imageUrl" :alt="item.clothingType" class="aspect-square w-full object-cover" />
          <div class="p-2">
            <p class="text-sm font-medium text-brand-900 capitalize truncate">{{ item.clothingType }}</p>
            <p class="text-xs text-brand-500">{{ item.colour }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
