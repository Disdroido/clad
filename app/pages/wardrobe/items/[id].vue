<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const wardrobeStore = useWardrobeStore()
const outfitStore = useOutfitStore()

interface Item {
  id: string
  imageUrl: string
  clothingType: string
  clothingSubType: string | null
  colour: string
  pattern: string
  material: string | null
  formalityLevel: string
  season: string
  aiConfidence: number | null
  isClean?: boolean
  condition?: string
  brand?: string | null
  pricePaid?: number | null
  purchaseDate?: string | null
}

const item = ref<Item | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const saved = ref(false)
const itemOutfits = ref<any[]>([])
const loadingOutfits = ref(false)

async function fetchItemOutfits() {
  loadingOutfits.value = true
  try {
    itemOutfits.value = await wardrobeStore.fetchItemOutfits(id)
  } catch {
    itemOutfits.value = []
  } finally {
    loadingOutfits.value = false
  }
}

onMounted(async () => {
  try {
    item.value = await wardrobeStore.fetchItem(id)
  } catch {
    error.value = 'Item not found'
  } finally {
    loading.value = false
  }
  fetchItemOutfits()
})

async function save() {
  if (!item.value) return
  saving.value = true
  saved.value = false
  try {
    item.value = await $fetch(`/api/wardrobe/items/${id}`, {
      method: 'PATCH',
      body: {
        clothingType: item.value.clothingType,
        clothingSubType: item.value.clothingSubType,
        colour: item.value.colour,
        pattern: item.value.pattern,
        material: item.value.material,
        formalityLevel: item.value.formalityLevel,
        season: item.value.season,
      },
    })
    saved.value = true
    wardrobeStore.invalidateItem(id)
    wardrobeStore.invalidate()
    outfitStore.invalidate()
    setTimeout(() => { saved.value = false }, 2000)
  } catch {
    error.value = 'Failed to save'
  } finally {
    saving.value = false
  }
}

const archiving = ref(false)

async function archiveItem() {
  if (!item.value || !confirm('Archive this item? You can restore it from Settings.')) return
  archiving.value = true
  try {
    await $fetch(`/api/wardrobe/items/${id}/archive`, {
      method: 'PATCH',
      body: { isArchived: true },
    })
    wardrobeStore.invalidate()
    outfitStore.invalidate()
    router.push('/wardrobe')
  } catch {
    error.value = 'Failed to archive item'
  } finally {
    archiving.value = false
  }
}

// Laundry toggle
const laundryLoading = ref(false)

async function toggleLaundry() {
  if (!item.value) return
  laundryLoading.value = true
  try {
    await $fetch(`/api/wardrobe/items/${id}/laundry`, {
      method: 'PATCH',
      body: { isClean: !item.value.isClean },
    })
    item.value.isClean = !item.value.isClean
    wardrobeStore.invalidate()
  } catch {
    error.value = 'Failed to update laundry status'
  } finally {
    laundryLoading.value = false
  }
}

// Condition selector
const conditionLoading = ref(false)
const conditions = [
  { value: 'new', label: 'New', activeClass: 'bg-green-100 text-green-700' },
  { value: 'good', label: 'Good', activeClass: 'bg-blue-100 text-blue-700' },
  { value: 'worn', label: 'Worn', activeClass: 'bg-amber-100 text-amber-700' },
  { value: 'needs_repair', label: 'Needs Repair', activeClass: 'bg-red-100 text-red-700' },
]

async function updateCondition(cond: string) {
  if (!item.value) return
  conditionLoading.value = true
  try {
    await $fetch(`/api/wardrobe/items/${id}/lifecycle`, {
      method: 'PATCH',
      body: { condition: cond },
    })
    item.value.condition = cond
    wardrobeStore.invalidateItem(id)
  } catch {
    error.value = 'Failed to update condition'
  } finally {
    conditionLoading.value = false
  }
}

// Purchase metadata
const showPurchaseMeta = ref(false)
const lifecycleSaving = ref(false)

const priceDisplay = computed({
  get: () => {
    if (!item.value || item.value.pricePaid == null) return null
    return (item.value.pricePaid / 100).toFixed(2)
  },
  set: (_val: string | number | null) => {
    // handled in saveLifecycle
  },
})

async function saveLifecycle() {
  if (!item.value) return
  lifecycleSaving.value = true
  try {
    const cents = priceDisplay.value != null
      ? Math.round(parseFloat(priceDisplay.value as string) * 100)
      : null
    const body: Record<string, any> = {
      brand: item.value.brand || null,
      pricePaid: cents,
      purchaseDate: item.value.purchaseDate || null,
    }
    await $fetch(`/api/wardrobe/items/${id}/lifecycle`, {
      method: 'PATCH',
      body,
    })
    if (cents != null) item.value.pricePaid = cents
    wardrobeStore.invalidateItem(id)
  } catch {
    error.value = 'Failed to save purchase details'
  } finally {
    lifecycleSaving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="flex justify-center py-20">
    <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
  </div>

  <div v-else-if="error && !item" class="flex flex-col items-center gap-4 py-20">
    <p class="text-brand-500">{{ error }}</p>
    <NuxtLink to="/wardrobe" class="text-brand-600 underline">Back to Wardrobe</NuxtLink>
  </div>

  <div v-else-if="item">
    <div class="mb-4">
      <NuxtLink to="/wardrobe" class="text-sm text-brand-400 hover:text-brand-600">&larr; Back to Wardrobe</NuxtLink>
    </div>

    <div class="flex flex-col gap-6 md:flex-row">
      <img
        :src="item.imageUrl"
        :alt="item.clothingType"
        class="aspect-square w-full rounded-xl object-cover shadow md:w-80"
      />

    <div class="flex-1 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-brand-600">Type</label>
          <select v-model="item.clothingType" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
            <option value="t-shirt">T-Shirt</option>
            <option value="shirt">Shirt</option>
            <option value="blouse">Blouse</option>
            <option value="sweater">Sweater</option>
            <option value="hoodie">Hoodie</option>
            <option value="jacket">Jacket</option>
            <option value="coat">Coat</option>
            <option value="jeans">Jeans</option>
            <option value="trousers">Trousers</option>
            <option value="shorts">Shorts</option>
            <option value="skirt">Skirt</option>
            <option value="dress">Dress</option>
            <option value="shoes">Shoes</option>
            <option value="accessory">Accessory</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-brand-600">Sub-Type</label>
          <input v-model="item.clothingSubType" type="text" placeholder="e.g. henley, polo" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-brand-600">Colour</label>
          <input v-model="item.colour" type="text" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-brand-600">Pattern</label>
          <select v-model="item.pattern" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
            <option value="solid">Solid</option>
            <option value="striped">Striped</option>
            <option value="checked">Checked</option>
            <option value="floral">Floral</option>
            <option value="graphic">Graphic</option>
            <option value="abstract">Abstract</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-brand-600">Material</label>
          <input v-model="item.material" type="text" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-brand-600">Formality</label>
          <select v-model="item.formalityLevel" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
            <option value="casual">Casual</option>
            <option value="smart_casual">Smart Casual</option>
            <option value="business_casual">Business Casual</option>
            <option value="formal">Formal</option>
            <option value="black_tie">Black Tie</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-brand-600">Season</label>
          <select v-model="item.season" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="autumn">Autumn</option>
            <option value="winter">Winter</option>
            <option value="all_season">All Season</option>
          </select>
        </div>
        <div v-if="item.aiConfidence" class="flex items-end pb-2">
          <p class="text-xs text-brand-400">AI Confidence: {{ Math.round(item.aiConfidence * 100) }}%</p>
        </div>
      </div>

      <!-- Laundry Toggle -->
      <div class="border-t border-brand-100 pt-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-brand-800">Laundry Status</p>
            <p class="text-xs text-brand-500">{{ item.isClean ? 'Clean & ready to wear' : 'In the laundry' }}</p>
          </div>
          <button
            @click="toggleLaundry"
            :disabled="laundryLoading"
            :class="[
              'rounded-full px-4 py-2 text-sm font-medium transition',
              item.isClean
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
            ]"
          >
            {{ laundryLoading ? '...' : item.isClean ? 'Mark Dirty' : 'Mark Clean' }}
          </button>
        </div>
      </div>

      <!-- Condition Selector -->
      <div class="border-t border-brand-100 pt-4">
        <label class="block text-xs font-medium text-brand-600 mb-2">Condition</label>
        <div class="flex gap-2">
          <button
            v-for="cond in conditions"
            :key="cond.value"
            @click="updateCondition(cond.value)"
            :class="[
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              item.condition === cond.value
                ? cond.activeClass
                : 'bg-brand-50 text-brand-500 hover:bg-brand-100',
            ]"
          >
            {{ cond.label }}
          </button>
        </div>
      </div>

      <!-- Purchase Metadata (collapsible) -->
      <div class="border-t border-brand-100 pt-4">
        <button @click="showPurchaseMeta = !showPurchaseMeta" class="flex w-full items-center justify-between">
          <span class="text-sm font-medium text-brand-800">Purchase Details</span>
          <span class="text-brand-400 text-xs">{{ showPurchaseMeta ? 'Hide' : 'Show' }}</span>
        </button>
        <div v-if="showPurchaseMeta" class="mt-3 space-y-3">
          <div>
            <label class="block text-xs font-medium text-brand-600">Brand</label>
            <input v-model="item.brand" type="text" placeholder="e.g., Uniqlo" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Price Paid</label>
            <input v-model="priceDisplay" type="number" step="0.01" placeholder="0.00" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Purchase Date</label>
            <input v-model="item.purchaseDate" type="date" class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <button
            @click="saveLifecycle"
            :disabled="lifecycleSaving"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition disabled:opacity-50"
          >
            {{ lifecycleSaving ? 'Saving...' : 'Save Purchase Details' }}
          </button>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          @click="save"
          :disabled="saving"
          class="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes' }}
        </button>
        <button
          @click="archiveItem"
          :disabled="archiving"
          class="rounded-lg border border-red-200 px-6 py-3 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
        >
          {{ archiving ? 'Archiving...' : 'Archive' }}
        </button>
      </div>

      <div v-if="itemOutfits.length > 0" class="mt-6 border-t border-brand-100 pt-6">
        <h3 class="mb-3 text-sm font-semibold text-brand-700">Outfits Using This Item</h3>
        <div class="grid grid-cols-2 gap-3">
          <NuxtLink
            v-for="outfit in itemOutfits"
            :key="outfit.id"
            :to="`/outfits/${outfit.id}`"
            class="rounded-lg border border-brand-100 bg-brand-50 p-3 hover:bg-brand-100 transition"
          >
            <span class="text-xs font-medium text-brand-600 capitalize">{{ outfit.occasion }}</span>
            <p class="mt-1 text-xs text-brand-500 line-clamp-2">{{ outfit.explanation }}</p>
          </NuxtLink>
        </div>
      </div>

      <div v-if="loadingOutfits" class="mt-6 border-t border-brand-100 pt-6">
        <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>

      <div class="mt-6 border-t border-brand-100 pt-4">
        <p class="text-xs text-brand-400">
          Related:
          <NuxtLink to="/outfits" class="mx-1 font-medium text-brand-600 hover:text-brand-700">Outfits</NuxtLink>·
          <NuxtLink to="/calendar" class="mx-1 font-medium text-brand-600 hover:text-brand-700">Calendar</NuxtLink>
        </p>
      </div>
    </div>
    </div>
  </div>
</template>
