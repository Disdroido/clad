<script setup lang="ts">
const route = useRoute()
const router = useRouter()

definePageMeta({ layout: 'default' })
useHead({ title: 'Trip — Clad' })

interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  purpose: string
}

const trip = ref<Trip | null>(null)
const loading = ref(true)
const generating = ref(false)
const error = ref('')
const deleting = ref(false)

const purposeEmoji: Record<string, string> = {
  vacation: '🏖️', business: '💼', adventure: '🏔️',
  city: '🌆', family: '👪', event: '🎉',
}

function getPurposeEmoji(p: string) { return purposeEmoji[p.toLowerCase()] || '✈️' }

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${s} — ${e}`
}

onMounted(async () => {
  try {
    trip.value = await $fetch(`/api/trips/${route.params.id}`)
  } catch {
    error.value = 'Trip not found'
  } finally {
    loading.value = false
  }
})

async function generatePackingList() {
  generating.value = true
  try {
    await $fetch('/api/calendar/packing', {
      method: 'POST',
      body: { tripId: route.params.id },
    })
    router.push(`/trips/${route.params.id}/packing`)
  } catch (err: any) {
    error.value = 'Couldn\'t generate packing list. Please try again.'
  } finally {
    generating.value = false
  }
}

async function deleteTrip() {
  if (!confirm('Delete this trip? This will also remove all scheduled outfits for this trip.')) return
  deleting.value = true
  try {
    await $fetch(`/api/trips/${route.params.id}`, { method: 'DELETE' })
    router.push('/trips')
  } catch {
    alert('Couldn\'t delete trip.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <NuxtLink to="/trips" class="text-sm text-brand-400 hover:text-brand-600">&larr; All Trips</NuxtLink>
      <button @click="deleteTrip" :disabled="deleting"
              class="text-sm text-red-500 hover:text-red-600 transition disabled:opacity-50">
        {{ deleting ? 'Deleting...' : '🗑️ Delete Trip' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Error -->
    <div v-else-if="error && !trip" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="text-red-700">{{ error }}</p>
      <NuxtLink to="/trips" class="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
        &larr; Back to Trips
      </NuxtLink>
    </div>

    <!-- Trip detail -->
    <div v-else-if="trip" class="mx-auto max-w-2xl">
      <div class="mb-6">
        <div class="mb-2 flex items-center gap-2">
          <span class="text-2xl">{{ getPurposeEmoji(trip.purpose) }}</span>
          <h1 class="text-2xl font-bold text-brand-950">{{ trip.name }}</h1>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-sm text-brand-600">
          <span>{{ trip.destination }}</span>
          <span class="text-brand-300">•</span>
          <span>{{ formatDateRange(trip.startDate, trip.endDate) }}</span>
          <span class="text-brand-300">•</span>
          <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs capitalize text-brand-700">{{ trip.purpose }}</span>
        </div>
      </div>

      <!-- Generate Packing List CTA -->
      <div class="mb-6 rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
        <div class="flex flex-col items-center text-center">
          <p class="mb-1 text-lg font-semibold text-brand-900">🧳 Packing List</p>
          <p class="mb-4 text-sm text-brand-500">
            Let AI create a packing list based on your destination and trip purpose.
          </p>
          <button @click="generatePackingList" :disabled="generating"
                  class="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50">
            {{ generating ? '🧳 Generating...' : '🧳 Generate Packing List' }}
          </button>
          <p v-if="error && generating === false" class="mt-2 text-sm text-red-600">{{ error }}</p>
        </div>
      </div>

      <!-- Scheduled Outfits section (placeholder — will be populated by future enhancement) -->
      <div class="rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 class="mb-3 text-base font-semibold text-brand-900">Scheduled Outfits</h2>
        <p class="text-sm text-brand-400">Outfits scheduled during this trip will appear here.</p>
      </div>
    </div>
  </div>
</template>
