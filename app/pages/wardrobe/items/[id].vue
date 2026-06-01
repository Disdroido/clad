<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

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
}

const item = ref<Item | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const saved = ref(false)

onMounted(async () => {
  try {
    item.value = await $fetch(`/api/wardrobe/items/${id}`)
  } catch {
    error.value = 'Item not found'
  } finally {
    loading.value = false
  }
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
    setTimeout(() => { saved.value = false }, 2000)
  } catch {
    error.value = 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!item.value || !confirm('Remove this item from your wardrobe?')) return
  try {
    await $fetch(`/api/wardrobe/items/${id}`, { method: 'DELETE' })
    router.push('/wardrobe')
  } catch {
    error.value = 'Failed to delete item'
  }
}
</script>

<template>
  <div v-if="loading" class="flex justify-center py-20">
    <span class="text-brand-500">Loading...</span>
  </div>

  <div v-else-if="error && !item" class="flex flex-col items-center gap-4 py-20">
    <p class="text-brand-500">{{ error }}</p>
    <NuxtLink to="/wardrobe" class="text-brand-600 underline">Back to Wardrobe</NuxtLink>
  </div>

  <div v-else-if="item" class="mx-auto max-w-lg">
    <div class="mb-4 flex items-center gap-2">
      <NuxtLink to="/wardrobe" class="text-sm text-brand-400 hover:text-brand-600">&larr; Back</NuxtLink>
    </div>

    <img
      :src="item.imageUrl"
      :alt="item.clothingType"
      class="mb-6 aspect-square w-full rounded-xl object-cover shadow"
    />

    <div class="space-y-4">
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

      <div class="flex gap-3 pt-2">
        <button
          @click="save"
          :disabled="saving"
          class="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes' }}
        </button>
        <button
          @click="remove"
          class="rounded-lg border border-red-200 px-6 py-3 text-red-500 hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
