<script setup lang="ts">
const props = defineProps<{
  outfitId: string
  initialLiked: boolean
  initialCount: number
  loggedIn: boolean
}>()

const emit = defineEmits<{
  toggled: [liked: boolean]
}>()

const liked = ref(props.initialLiked)
const count = ref(props.initialCount)
const loading = ref(false)

async function toggle() {
  if (!props.loggedIn) return
  loading.value = true
  const prevLiked = liked.value
  const prevCount = count.value
  liked.value = !liked.value
  count.value += liked.value ? 1 : -1

  try {
    const result: any = await $fetch(`/api/outfits/${props.outfitId}/like`, { method: 'POST' })
    liked.value = result.liked
    count.value = result.likeCount
    emit('toggled', result.liked)
  } catch {
    liked.value = prevLiked
    count.value = prevCount
  } finally {
    loading.value = false
  }
}

// Sync when props change (e.g., navigating between pages)
watch(() => [props.initialLiked, props.initialCount], ([newLiked, newCount]) => {
  liked.value = newLiked
  count.value = newCount
})
</script>

<template>
  <button
    @click="toggle"
    :disabled="!loggedIn || loading"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition disabled:opacity-50"
    :class="liked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-100 text-brand-500 hover:bg-brand-200'"
  >
    <span>{{ liked ? '❤️' : '🤍' }}</span>
    <span>{{ count }}</span>
  </button>
</template>
