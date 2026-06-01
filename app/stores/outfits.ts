export const useOutfitStore = defineStore('outfits', () => {
  const outfits = ref<any[]>([])
  const outfitCache = ref<Record<string, any>>({})
  const wearHistory = ref<{ events: any[]; total: number }>({ events: [], total: 0 })
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchOutfits(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const data: any = await $fetch('/api/outfits')
      outfits.value = data.outfits ?? []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function fetchOutfit(id: string) {
    if (outfitCache.value[id]) return outfitCache.value[id]
    const data: any = await $fetch(`/api/outfits/${id}`)
    outfitCache.value[id] = data
    return data
  }

  async function fetchWearHistory(limit = 20, offset = 0) {
    const data: any = await $fetch('/api/outfits/wear-history', {
      params: { limit, offset }
    })
    wearHistory.value = { events: data.events, total: data.total }
    return wearHistory.value
  }

  function invalidate() {
    loaded.value = false
    outfits.value = []
  }

  function invalidateOutfit(id: string) {
    delete outfitCache.value[id]
  }

  function invalidateAll() {
    invalidate()
    outfitCache.value = {}
    wearHistory.value = { events: [], total: 0 }
  }

  return {
    outfits, outfitCache, wearHistory, loaded, loading,
    fetchOutfits, fetchOutfit, fetchWearHistory,
    invalidate, invalidateOutfit, invalidateAll,
  }
})
