<script setup lang="ts">
const props = defineProps<{
  outfitId: string
  initialSaved: boolean
  loggedIn: boolean
}>()

const emit = defineEmits<{
  toggled: [saved: boolean]
}>()

const saved = ref(props.initialSaved)
const loading = ref(false)

async function toggle() {
  if (!props.loggedIn) return
  loading.value = true
  const prevSaved = saved.value
  saved.value = !saved.value

  try {
    const result: any = await $fetch(`/api/outfits/${props.outfitId}/save`, { method: 'POST' })
    saved.value = result.saved
    emit('toggled', result.saved)
  } catch {
    saved.value = prevSaved
  } finally {
    loading.value = false
  }
}

watch(() => props.initialSaved, (newVal) => {
  saved.value = newVal
})
</script>

<template>
  <button
    @click="toggle"
    :disabled="!loggedIn || loading"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition disabled:opacity-50"
    :class="saved ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'bg-brand-100 text-brand-500 hover:bg-brand-200'"
  >
    <span>{{ saved ? '💾' : '📁' }}</span>
    <span>{{ saved ? 'Saved' : 'Save' }}</span>
  </button>
</template>
