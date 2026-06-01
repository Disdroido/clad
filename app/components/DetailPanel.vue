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
  date: Date | null
  outfits: ScheduledOutfit[]
}>()

const emit = defineEmits<{
  schedule: [date: string]
  edit: [outfit: ScheduledOutfit]
  remove: [id: string]
}>()

const formatDateFull = computed(() => {
  if (!props.date) return ''
  return props.date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
})

const dateKey = computed(() => {
  if (!props.date) return ''
  return props.date.toISOString().split('T')[0]
})

const isEmpty = computed(() => !props.outfits || props.outfits.length === 0)
</script>

<template>
  <div v-if="date" class="mt-4 rounded-xl bg-white p-6 shadow-sm border border-brand-100">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-brand-900">{{ formatDateFull }}</h3>
    </div>

    <!-- Empty state for this date -->
    <div v-if="isEmpty" class="py-6 text-center">
      <p class="mb-3 text-sm text-brand-500">Nothing scheduled for this day</p>
      <button @click="$emit('schedule', dateKey)"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition">
        + Schedule Outfit
      </button>
    </div>

    <!-- Scheduled outfit cards -->
    <div v-else class="space-y-2">
      <ScheduledOutfitCard
        v-for="outfit in outfits" :key="outfit.id"
        :outfit="outfit"
        @edit="(o: ScheduledOutfit) => $emit('edit', o)"
        @remove="(id: string) => $emit('remove', id)"
      />
      <button @click="$emit('schedule', dateKey)"
              class="mt-3 w-full rounded-lg border border-dashed border-brand-300 py-2 text-sm text-brand-500 hover:text-brand-700 hover:border-brand-500 transition">
        + Schedule Outfit
      </button>
    </div>
  </div>
</template>
