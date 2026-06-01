export const useDiscoverStore = defineStore('discover', () => {
  const items = ref<any[]>([])
  const offset = ref(0)
  const hasMore = ref(true)
  const loading = ref(false)
  const loadingMore = ref(false)

  async function fetchFeed(isInitial = false) {
    if (isInitial && items.value.length > 0) return

    if (isInitial) {
      loading.value = true
      offset.value = 0
    } else {
      loadingMore.value = true
    }

    try {
      const res: any = await $fetch('/api/discover', {
        params: { limit: 20, offset: offset.value },
      })

      if (isInitial) {
        items.value = res.items || []
      } else {
        items.value.push(...(res.items || []))
      }

      hasMore.value = (res.items || []).length >= 20
      offset.value += 20
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  function invalidate() {
    items.value = []
    offset.value = 0
    hasMore.value = true
  }

  return {
    items, offset, hasMore, loading, loadingMore,
    fetchFeed, invalidate,
  }
})
