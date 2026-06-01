<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Generate Outfit — Clad'
})

const router = useRouter()

const occasions = [
  { id: 'casual', label: 'Casual', icon: '👕', desc: 'Everyday errands, hanging out' },
  { id: 'work', label: 'Work', icon: '💼', desc: 'Office or professional setting' },
  { id: 'date', label: 'Date Night', icon: '🌹', desc: 'Romantic dinner or drinks' },
  { id: 'formal', label: 'Formal', icon: '✨', desc: 'Wedding, gala, special event' },
  { id: 'active', label: 'Active', icon: '🏃', desc: 'Gym, workout, outdoor activity' },
]

const selectedOccasion = ref<string | null>(null)
const generating = ref(false)

async function generateOutfit() {
  if (!selectedOccasion.value) return

  generating.value = true

  try {
    await $fetch('/api/outfits/generate', {
      method: 'POST',
      body: { occasion: selectedOccasion.value },
    })
    router.push(`/outfits/result?occasion=${selectedOccasion.value}`)
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to generate outfit'
    alert(msg)
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-brand-950 mb-2">Pick My Outfit</h1>
    <p class="text-brand-500 mb-6">What's the occasion?</p>

    <!-- Occasion picker -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-8">
      <button
        v-for="occ in occasions"
        :key="occ.id"
        @click="selectedOccasion = occ.id"
        :class="[
          'rounded-xl border-2 p-4 text-left transition hover:shadow-md',
          selectedOccasion === occ.id
            ? 'border-brand-600 bg-brand-50'
            : 'border-brand-200 bg-white hover:border-brand-300'
        ]"
      >
        <div class="text-2xl mb-1">{{ occ.icon }}</div>
        <p class="font-medium text-brand-900">{{ occ.label }}</p>
        <p class="text-sm text-brand-500">{{ occ.desc }}</p>
      </button>
    </div>

    <!-- Generate button -->
    <button
      @click="generateOutfit"
      :disabled="!selectedOccasion || generating"
      class="w-full rounded-lg bg-brand-600 py-4 text-lg font-medium text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="generating" class="flex items-center justify-center gap-2">
        <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        AI is picking your outfit...
      </span>
      <span v-else>
        ✨ Pick My Outfit
      </span>
    </button>

  </div>
</template>
