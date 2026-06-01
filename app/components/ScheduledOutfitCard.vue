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
</script>

<template>
  <div class="group rounded-lg border border-brand-100 bg-white p-3 hover:border-brand-200 transition">
    <div class="mb-2 flex items-start gap-2">
      <!-- Item thumbnails -->
      <div v-if="outfit.items?.length" class="flex gap-1 shrink-0">
        <img v-for="item in outfit.items.slice(0, 4)" :key="item.id"
             :src="item.imageUrl" :alt="item.clothingType"
             class="h-10 w-10 rounded-lg border border-brand-100 object-cover" />
        <span v-if="outfit.items.length > 4"
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xs font-medium text-brand-500">
          +{{ outfit.items.length - 4 }}
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <NuxtLink :to="`/outfits/${outfit.outfitId}`"
                  class="text-sm font-semibold text-brand-900 hover:text-brand-600 transition">
          {{ outfit.outfitName || 'Unnamed Outfit' }}
        </NuxtLink>
        <span v-if="outfit.outfitOccasion"
              class="ml-2 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-600 capitalize">
          {{ outfit.outfitOccasion }}
        </span>
        <p v-if="outfit.notes" class="mt-1 text-xs text-brand-400">{{ outfit.notes }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button @click="$emit('edit', outfit)"
                class="rounded-lg p-1.5 text-brand-400 hover:text-brand-600 hover:bg-brand-50 transition"
                title="Edit notes">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button @click="confirmRemove"
                class="rounded-lg p-1.5 text-brand-400 hover:text-red-500 hover:bg-red-50 transition"
                title="Remove">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
