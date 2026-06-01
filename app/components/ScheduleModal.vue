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
    scheduledDate.value = props.selectedDate || ''
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
    error.value = err?.data?.message || 'Couldn\'t schedule outfit. Please try again.'
  } finally {
    saving.value = false
  }
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         @click.self="$emit('close')">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-brand-900">📅 Schedule Outfit</h2>
          <button @click="$emit('close')" class="text-brand-400 hover:text-brand-600 text-xl leading-none">&times;</button>
        </div>

        <!-- Date display -->
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium text-brand-700">Date</label>
          <input type="date" v-model="scheduledDate"
                 class="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>

        <!-- Outfit selector -->
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium text-brand-700">Outfit</label>
          <div v-if="loadingOutfits" class="py-4 text-center text-sm text-brand-400">Loading outfits...</div>
          <div v-else-if="outfits.length === 0" class="py-4 text-center text-sm text-brand-400">
            No outfits available. Create one first!
          </div>
          <div v-else class="max-h-48 space-y-1 overflow-y-auto">
            <button v-for="outfit in outfits" :key="outfit.id"
                    @click="selectedOutfitId = outfit.id"
                    class="w-full rounded-lg border px-3 py-2 text-left text-sm transition"
                    :class="selectedOutfitId === outfit.id
                      ? 'border-brand-600 bg-brand-50 text-brand-900'
                      : 'border-brand-200 text-brand-700 hover:border-brand-300'">
              <span class="font-medium">{{ outfit.name }}</span>
              <span v-if="outfit.occasion" class="ml-2 text-xs text-brand-400">({{ outfit.occasion }})</span>
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium text-brand-700">Notes (optional)</label>
          <textarea v-model="notes" placeholder="Any notes for this day?"
                    class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    rows="2" />
        </div>

        <!-- Error -->
        <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button @click="$emit('close')"
                  class="flex-1 rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition">
            Cancel
          </button>
          <button @click="schedule" :disabled="!selectedOutfitId || !scheduledDate || saving"
                  class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50">
            {{ saving ? 'Scheduling...' : '📅 Schedule' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
