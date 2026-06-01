<script setup lang="ts">
const props = defineProps<{
  username: string
  initialFollowing: boolean
  loggedIn: boolean
}>()

const emit = defineEmits<{
  toggled: [following: boolean]
}>()

const following = ref(props.initialFollowing)
const loading = ref(false)

async function toggle() {
  if (!props.loggedIn) return
  loading.value = true
  const prevFollowing = following.value
  following.value = !following.value

  try {
    const result: any = await $fetch(`/api/profiles/${props.username}/follow`, { method: 'POST' })
    following.value = result.following
    emit('toggled', result.following)
  } catch {
    following.value = prevFollowing
  } finally {
    loading.value = false
  }
}

watch(() => props.initialFollowing, (newVal) => {
  following.value = newVal
})
</script>

<template>
  <button
    @click="toggle"
    :disabled="!loggedIn || loading"
    class="rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50"
    :class="following
      ? 'border border-brand-300 bg-white text-brand-700 hover:bg-brand-50'
      : 'bg-brand-600 text-white hover:bg-brand-700'"
  >
    {{ following ? '✓ Following' : '+ Follow' }}
  </button>
</template>
