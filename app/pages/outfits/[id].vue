<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const outfit = ref<any>(null)
const loading = ref(true)
const archiving = ref(false)
const wearing = ref(false)
const wearSuccess = ref(false)
const userRating = ref<number>(0)
const savingRating = ref(false)

definePageMeta({ layout: 'default' })
useHead({ title: 'Outfit — Clad' })

async function fetchOutfit() {
  loading.value = true
  try {
    outfit.value = await $fetch(`/api/outfits/${route.params.id}`)
    userRating.value = outfit.value?.rating || 0
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to load outfit'
    alert(msg)
    router.push('/outfits')
  } finally {
    loading.value = false
  }
}

async function archiveOutfit() {
  if (!confirm('Archive this outfit? You can restore it from Settings.')) return
  archiving.value = true
  try {
    await $fetch(`/api/outfits/${route.params.id}/archive`, {
      method: 'PATCH',
      body: { isArchived: true },
    })
    router.push('/outfits')
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to archive outfit'
    alert(msg)
  } finally {
    archiving.value = false
  }
}

async function logWear() {
  wearing.value = true
  wearSuccess.value = false
  try {
    await $fetch('/api/outfits/' + outfit.value.id + '/wear', { method: 'POST' })
    wearSuccess.value = true
    setTimeout(() => { wearSuccess.value = false }, 2000)
    await fetchOutfit() // refresh to get updated wearCount
  } catch { /* ignore */ }
  finally { wearing.value = false }
}

async function setRating(rating: number) {
  savingRating.value = true
  userRating.value = rating // optimistic
  try {
    await $fetch('/api/outfits/' + outfit.value.id + '/rating', {
      method: 'PATCH',
      body: { rating }
    })
  } catch {
    userRating.value = outfit.value?.rating || 0 // revert
  }
  finally { savingRating.value = false }
}

onMounted(fetchOutfit)
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <NuxtLink to="/outfits" class="text-sm text-brand-400 hover:text-brand-600">&larr; All Outfits</NuxtLink>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div v-else-if="outfit" class="rounded-xl bg-white p-6 shadow-lg md:p-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-brand-900">Your Outfit</h2>
        <span class="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 capitalize">
          {{ outfit.occasion }}
        </span>
      </div>

      <p class="text-brand-600 italic mb-6">{{ outfit.explanation }}</p>

      <div class="flex gap-4 text-sm text-brand-500 mb-4">
        <span v-if="outfit.wearCount > 0">
          👗 Worn {{ outfit.wearCount }} time{{ outfit.wearCount === 1 ? '' : 's' }}
        </span>
        <span v-if="outfit.lastWornAt">
          Last worn {{ new Date(outfit.lastWornAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
        </span>
        <span v-else-if="outfit.wearCount === 0 || outfit.wearCount === undefined">
          Not worn yet
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div
          v-for="item in outfit.items"
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

      <div class="flex gap-3 mb-4">
        <button
          @click="logWear"
          :disabled="wearing"
          class="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ wearing ? 'Logging...' : wearSuccess ? '✅ Logged!' : '👕 Log as Worn Today' }}
        </button>
      </div>

      <div class="mb-6">
        <p class="text-sm font-medium text-brand-700 mb-2">Rate this outfit</p>
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            @click="setRating(star)"
            :disabled="savingRating"
            class="text-2xl transition hover:scale-110 disabled:opacity-50"
          >
            {{ (userRating >= star) ? '⭐' : '☆' }}
          </button>
        </div>
      </div>

      <button
        @click="archiveOutfit"
        :disabled="archiving"
        class="mt-6 w-full rounded-lg border border-red-200 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition disabled:opacity-50"
      >
        {{ archiving ? 'Archiving...' : 'Archive Outfit' }}
      </button>
    </div>
  </div>
</template>
