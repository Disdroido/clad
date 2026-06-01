export const useInspirationStore = defineStore('inspiration', () => {
  const items = ref<any[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchInspiration(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const data: any = await $fetch('/api/inspiration')
      items.value = data.items ?? []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  function invalidate() {
    loaded.value = false
    items.value = []
  }

  return {
    items, loaded, loading,
    fetchInspiration, invalidate,
  }
})
