<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const outfit = ref<any>(null)
const loading = ref(true)

definePageMeta({ layout: 'default' })
useHead({ title: 'Outfit — Clad' })

async function fetchOutfit() {
  loading.value = true
  try {
    outfit.value = await $fetch(`/api/outfits/${route.params.id}`)
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to load outfit'
    alert(msg)
    router.push('/outfits')
  } finally {
    loading.value = false
  }
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
    </div>
  </div>
</template>
