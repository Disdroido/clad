<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const outfitStore = useOutfitStore()

const occasion = ref(route.query.occasion as string || '')
const outfitResult = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const showWeatherFallback = ref(false)

const lat = computed(() => route.query.lat ? parseFloat(route.query.lat as string) : undefined)
const lon = computed(() => route.query.lon ? parseFloat(route.query.lon as string) : undefined)

async function generateOutfit() {
  loading.value = true
  showWeatherFallback.value = false
  try {
    const body: Record<string, any> = { occasion: occasion.value }
    if (lat.value !== undefined && lon.value !== undefined) {
      body.lat = lat.value
      body.lon = lon.value
    }
    outfitResult.value = await $fetch('/api/outfits/generate', {
      method: 'POST',
      body,
    })
    if ((outfitResult.value as any)?.weatherFallback) {
      showWeatherFallback.value = true
      setTimeout(() => { showWeatherFallback.value = false }, 6000)
    }
  } catch (err: any) {
    outfitResult.value = null
    const msg = err?.data?.message || err?.message || 'Failed to generate outfit'
    alert(msg)
  } finally {
    loading.value = false
  }
}

async function saveOutfit() {
  const result = outfitResult.value
  if (!result) return

  const { items, occasion, explanation } = result
  if (!occasion || !explanation || !items?.length) {
    alert('Missing outfit data — try regenerating')
    return
  }

  saving.value = true
  try {
    const saved = await $fetch('/api/outfits', {
      method: 'POST',
      body: {
        occasion,
        explanation,
        itemIds: items.map((i: any) => i.id),
      },
    })
    outfitStore.invalidate()
    router.push(`/outfits/${saved.id}`)
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to save outfit'
    alert(msg)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (occasion.value) {
    generateOutfit()
  } else {
    router.push('/outfits/generate')
  }
})
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <NuxtLink to="/outfits/generate" class="text-sm text-brand-400 hover:text-brand-600">&larr; Pick Different Occasion</NuxtLink>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-brand-500">AI is picking your outfit...</p>
    </div>

    <div v-else-if="outfitResult" class="rounded-xl bg-white p-6 shadow-lg md:p-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-brand-900">Your Outfit</h2>
        <div class="flex items-center gap-2">
          <WeatherBadge
            v-if="outfitResult.weather"
            :temperature="outfitResult.weather.temperature"
            :condition="outfitResult.weather.condition"
            :icon-url="outfitResult.weather.iconUrl"
            :location-name="outfitResult.weather.locationName"
          />
          <span class="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 capitalize">
            {{ outfitResult.occasion }}
          </span>
        </div>
      </div>

      <div
        v-if="showWeatherFallback"
        class="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
      >
        Weather unavailable — using your climate settings
      </div>

      <p class="text-brand-600 italic mb-6">{{ outfitResult.explanation }}</p>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div
          v-for="item in outfitResult.items"
          :key="item.id"
          class="overflow-hidden rounded-lg border border-brand-100"
        >
          <img :src="item.imageUrl" :alt="item.clothingType" class="aspect-square w-full object-cover" />
          <div class="p-2 text-center">
            <p class="text-sm font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
            <p class="text-xs text-brand-500">{{ item.colour }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <button
          @click="generateOutfit"
          class="flex-1 rounded-lg border border-brand-300 py-3 text-brand-700 hover:bg-brand-50 transition"
        >
          🎲 Regenerate
        </button>
        <button
          @click="saveOutfit"
          :disabled="saving"
          class="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : '💾 Save Outfit' }}
        </button>
      </div>
    </div>
  </div>
</template>
