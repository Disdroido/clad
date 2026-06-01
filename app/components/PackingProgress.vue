<script setup lang="ts">
const props = defineProps<{
  packed: number
  total: number
}>()

const percentage = computed(() =>
  props.total > 0 ? Math.round((props.packed / props.total) * 100) : 0
)
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
      <div class="h-full rounded-full bg-brand-600 transition-all duration-300"
           :style="{ width: `${percentage}%` }" />
    </div>
    <span class="shrink-0 text-sm text-brand-500">
      {{ packed === total ? '✓ All packed!' : `Packed: ${packed}/${total} items` }}
    </span>
  </div>
</template>
