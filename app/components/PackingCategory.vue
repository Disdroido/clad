<script setup lang="ts">
interface PackingItemData {
  itemId: string
  clothingType: string
  colour: string
  imageUrl: string | null
  reason?: string
}

defineProps<{
  category: string
  items: PackingItemData[]
  checkedMap: Record<string, boolean>
}>()

const emit = defineEmits<{
  toggle: [itemId: string]
}>()

const categoryIcons: Record<string, string> = {
  't-shirt': '👕', shirt: '👔', blouse: '👚', sweater: '🧶',
  hoodie: '👕', jacket: '🧥', coat: '🧥', jeans: '👖',
  trousers: '👖', shorts: '🩳', skirt: '👗', dress: '👗',
  shoes: '👟', accessory: '👜',
}

function getIcon(type: string) {
  return categoryIcons[type] || '👕'
}
</script>

<template>
  <div class="mb-4">
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
      {{ getIcon(category) }} {{ category }} ({{ items.length }})
    </p>
    <div class="space-y-1.5">
      <PackingItem
        v-for="item in items" :key="item.itemId"
        :item="item"
        :checked="!!checkedMap[item.itemId]"
        @toggle="(id: string) => $emit('toggle', id)"
      />
    </div>
  </div>
</template>
