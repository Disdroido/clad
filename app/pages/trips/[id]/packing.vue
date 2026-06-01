<script setup lang="ts">
const route = useRoute()
const router = useRouter()

definePageMeta({ layout: 'default' })
useHead({ title: 'Packing List — Clad' })

interface PackingItemData {
  itemId: string
  clothingType: string
  colour: string
  imageUrl: string | null
  reason?: string
}

interface Trip {
  id: string
  name: string
  destination: string
}

const trip = ref<Trip | null>(null)
const grouped = ref<Record<string, PackingItemData[]>>({})
const packedItems = ref<Record<string, boolean>>({})
const loading = ref(true)
const error = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const wardrobeEmpty = ref(false)

const totalItems = computed(() => {
  return Object.values(grouped.value).reduce((sum, items) => sum + items.length, 0)
})

const packedCount = computed(() => {
  return Object.values(packedItems.value).filter(Boolean).length
})

const categories = computed(() => {
  return Object.entries(grouped.value).sort(([a], [b]) => a.localeCompare(b))
})

function toggleItem(itemId: string) {
  packedItems.value[itemId] = !packedItems.value[itemId]
  saveMessage.value = ''
}

async function loadPackingList() {
  loading.value = true
  error.value = false
  wardrobeEmpty.value = false
  try {
    // Fetch trip info
    trip.value = await $fetch(`/api/trips/${route.params.id}`)

    // Generate packing list
    const result: any = await $fetch('/api/calendar/packing', {
      method: 'POST',
      body: { tripId: route.params.id },
    })

    if (result.wardrobeEmpty) {
      wardrobeEmpty.value = true
      grouped.value = {}
      return
    }

    if (result.success && result.data?.grouped) {
      grouped.value = result.data.grouped
      // Initialize all items as packed by default
      for (const items of Object.values(result.data.grouped) as PackingItemData[][]) {
        for (const item of items) {
          packedItems.value[item.itemId] = true
        }
      }
    } else {
      error.value = true
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function savePackingList() {
  saving.value = true
  saveMessage.value = ''
  try {
    // Persist packed state to localStorage for now
    // (server persistence is a future enhancement per research recommendation)
    localStorage.setItem(`packing_${route.params.id}`, JSON.stringify(packedItems.value))
    saveMessage.value = '✅ Packing list saved!'
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch {
    saveMessage.value = 'Couldn\'t save packing list.'
  } finally {
    saving.value = false
  }
}

// Load saved state from localStorage
function loadSavedState() {
  try {
    const saved = localStorage.getItem(`packing_${route.params.id}`)
    if (saved) {
      packedItems.value = JSON.parse(saved)
    }
  } catch { /* ignore */ }
}

onMounted(() => {
  loadPackingList()
  loadSavedState()
})
</script>

<template>
  <div>
    <div class="mb-4">
      <NuxtLink :to="`/trips/${route.params.id}`" class="text-sm text-brand-400 hover:text-brand-600">
        &larr; {{ trip?.name || 'Trip' }}
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-sm text-brand-500">🧳 AI is building your packing list...</p>
    </div>

    <!-- Wardrobe empty -->
    <div v-else-if="wardrobeEmpty"
         class="mx-auto max-w-lg rounded-lg border-2 border-dashed border-brand-200 py-20 text-center">
      <p class="mb-2 text-lg font-medium text-brand-600">Your wardrobe is empty</p>
      <p class="mb-4 text-sm text-brand-400">Add items to your wardrobe first, then generate a packing list.</p>
      <NuxtLink to="/wardrobe/upload"
                class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition">
        Add Items
      </NuxtLink>
    </div>

    <!-- Error -->
    <div v-else-if="error"
         class="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="mb-3 text-red-700">Couldn't generate packing list. Please try again.</p>
      <button @click="loadPackingList"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition">
        Try Again
      </button>
    </div>

    <!-- Packing list -->
    <div v-else class="mx-auto max-w-2xl">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-brand-950">🧳 Packing List</h1>
          <p v-if="trip" class="text-sm text-brand-500">for {{ trip.destination }}</p>
        </div>
        <button @click="savePackingList" :disabled="saving"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50">
          {{ saving ? 'Saving...' : '💾 Save List' }}
        </button>
      </div>

      <p class="mb-4 text-xs text-brand-400">AI-generated • Edit by toggling items below</p>

      <!-- Progress -->
      <div class="mb-6">
        <PackingProgress :packed="packedCount" :total="totalItems" />
      </div>

      <!-- Categories -->
      <div v-if="categories.length > 0">
        <PackingCategory
          v-for="[category, items] in categories" :key="category"
          :category="category"
          :items="items"
          :checked-map="packedItems"
          @toggle="toggleItem"
        />
      </div>

      <!-- Save message -->
      <p v-if="saveMessage" class="mt-4 text-center text-sm text-green-600">{{ saveMessage }}</p>
    </div>
  </div>
</template>
