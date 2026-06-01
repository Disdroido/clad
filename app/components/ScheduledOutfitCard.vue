<script setup lang="ts">
interface ScheduledOutfit {
  id: string
  outfitId: string
  outfitName: string
  outfitOccasion: string
  notes?: string
  items: Array<{ id: string; imageUrl: string; clothingType: string; colour: string }>
  scheduledDate: string
}

const props = defineProps<{
  outfit: ScheduledOutfit
}>()

const emit = defineEmits<{
  edit: [outfit: ScheduledOutfit]
  remove: [id: string]
}>()

async function confirmRemove() {
  if (!confirm('Remove this scheduled outfit? This won\'t delete the outfit itself.')) return
  emit('remove', props.outfit.id)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="rounded-lg border border-brand-100 bg-white p-3">
    <div class="mb-2 flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-brand-900">{{ outfit.outfitName || 'Unnamed Outfit' }}</p>
        <span v-if="outfit.outfitOccasion"
              class="inline-block mt-0.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700 capitalize">
          {{ outfit.outfitOccasion }}
        </span>
      </div>
      <div class="flex gap-1">
        <button @click="$emit('edit', outfit)" class="rounded p-1 text-sm text-brand-400 hover:text-brand-600 transition"
                title="Edit notes">✏️</button>
        <button @click="confirmRemove" class="rounded p-1 text-sm text-brand-400 hover:text-red-500 transition"
                title="Remove from schedule">🗑️</button>
      </div>
    </div>

    <!-- Item thumbnails -->
    <div v-if="outfit.items?.length" class="mb-2 flex gap-1.5">
      <img v-for="item in outfit.items.slice(0, 4)" :key="item.id"
           :src="item.imageUrl" :alt="item.clothingType"
           class="h-8 w-8 rounded-md border border-brand-200 object-cover" />
      <span v-if="outfit.items.length > 4"
            class="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-xs text-brand-500">
        +{{ outfit.items.length - 4 }}
      </span>
    </div>

    <p v-if="outfit.notes" class="text-xs text-brand-500 italic">📎 {{ outfit.notes }}</p>
  </div>
</template>
