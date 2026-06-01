<script setup lang="ts">
interface OutfitOption {
  id: string
  name: string
  occasion: string
}

const props = defineProps<{
  show: boolean
  selectedDate?: string
}>()

const emit = defineEmits<{
  close: []
  scheduled: []
}>()

const selectedOutfitId = ref('')
const scheduledDate = ref(props.selectedDate || '')
const notes = ref('')
const saving = ref(false)
const error = ref('')
const outfits = ref<OutfitOption[]>([])
const loadingOutfits = ref(false)

watch(() => props.show, async (val) => {
  if (val) {
    scheduledDate.value = props.selectedDate || new Date().toISOString().split('T')[0]
    notes.value = ''
    selectedOutfitId.value = ''
    error.value = ''
    await loadOutfits()
  }
})

async function loadOutfits() {
  loadingOutfits.value = true
  try {
    const data: any[] = await $fetch('/api/outfits')
    outfits.value = data
      .filter(o => !o.isArchived)
      .map(o => ({ id: o.id, name: o.name || 'Unnamed Outfit', occasion: o.occasion || '' }))
  } catch {
    outfits.value = []
  } finally {
    loadingOutfits.value = false
  }
}

async function schedule() {
  if (!selectedOutfitId.value || !scheduledDate.value) return
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/calendar', {
      method: 'POST',
      body: {
        outfitId: selectedOutfitId.value,
        scheduledDate: scheduledDate.value,
        notes: notes.value || null,
      },
    })
    emit('scheduled')
    emit('close')
  } catch (err: any) {
    error.value = err?.data?.message || 'Couldn\'t schedule outfit.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         @click.self="$emit('close')">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-brand-900">Schedule Outfit</h2>
          <button @click="$emit('close')"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Date -->
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium text-brand-700">Date</label>
          <input type="date" v-model="scheduledDate"
                 class="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>

        <!-- Outfit selector -->
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium text-brand-700">Outfit</label>
          <div v-if="loadingOutfits" class="py-6 text-center text-sm text-brand-400">Loading outfits...</div>
          <div v-else-if="outfits.length === 0" class="py-6 text-center text-sm text-brand-400">
            No outfits yet. <NuxtLink to="/outfits" class="text-brand-600 underline">Create one first</NuxtLink>
          </div>
          <div v-else class="max-h-52 space-y-1 overflow-y-auto">
            <button v-for="outfit in outfits" :key="outfit.id"
                    @click="selectedOutfitId = outfit.id"
                    class="w-full rounded-lg border px-3 py-2.5 text-left text-sm transition"
                    :class="selectedOutfitId === outfit.id
                      ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-200'
                      : 'border-brand-200 text-brand-700 hover:border-brand-300'">
              <span class="font-medium">{{ outfit.name }}</span>
              <span v-if="outfit.occasion" class="ml-2 text-xs text-brand-400 capitalize">({{ outfit.occasion }})</span>
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div class="mb-5">
          <label class="mb-1.5 block text-sm font-medium text-brand-700">Notes (optional)</label>
          <textarea v-model="notes" placeholder="e.g. dinner party, job interview..."
                    class="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    rows="2" />
        </div>

        <!-- Error -->
        <p v-if="error" class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button @click="$emit('close')"
                  class="flex-1 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition">
            Cancel
          </button>
          <button @click="schedule" :disabled="!selectedOutfitId || !scheduledDate || saving"
                  class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {{ saving ? 'Scheduling...' : 'Schedule' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
