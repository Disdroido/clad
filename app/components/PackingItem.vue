<script setup lang="ts">
interface PackingItemData {
  itemId: string
  clothingType: string
  colour: string
  imageUrl: string | null
  reason?: string
}

const props = defineProps<{
  item: PackingItemData
  checked: boolean
}>()

const emit = defineEmits<{
  toggle: [itemId: string]
}>()
</script>

<template>
  <div @click="$emit('toggle', item.itemId)"
       class="flex cursor-pointer items-center gap-3 rounded-lg border border-brand-100 bg-white p-3 transition hover:bg-brand-50">
    <!-- Checkbox -->
    <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-sm"
         :class="checked
           ? 'border-brand-600 bg-brand-600 text-white'
           : 'border-brand-300 bg-white'">
      <span v-if="checked">✓</span>
    </div>

    <!-- Thumbnail -->
    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.clothingType"
         class="h-10 w-10 shrink-0 rounded-md border border-brand-200 object-cover" />
    <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-100 text-xs text-brand-400">
      {{ item.clothingType.slice(0, 2) }}
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
      <p class="text-xs text-brand-500">{{ item.colour }}</p>
    </div>

    <!-- Reason -->
    <p v-if="item.reason" class="hidden text-xs italic text-brand-400 sm:block max-w-40 truncate">
      {{ item.reason }}
    </p>
  </div>
</template>
