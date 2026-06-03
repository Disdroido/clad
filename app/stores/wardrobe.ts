export const useWardrobeStore = defineStore('wardrobe', () => {
  const items = ref<any[]>([])
  const itemCache = ref<Record<string, any>>({})
  const itemOutfitsCache = ref<Record<string, any[]>>({})
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchItems(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const data: any = await $fetch('/api/wardrobe/items')
      items.value = (Array.isArray(data?.items) ? data.items : []).filter(Boolean)
      loaded.value = true
    } catch {
      items.value = items.value.length ? items.value : []
    } finally {
      loading.value = false
    }
  }

  async function fetchItem(id: string) {
    if (itemCache.value[id]) return itemCache.value[id]
    const data: any = await $fetch(`/api/wardrobe/items/${id}`)
    itemCache.value[id] = data
    return data
  }

  async function fetchItemOutfits(id: string) {
    if (itemOutfitsCache.value[id]) return itemOutfitsCache.value[id]
    const data: any = await $fetch(`/api/wardrobe/items/${id}/outfits`)
    itemOutfitsCache.value[id] = data.outfits ?? []
    return itemOutfitsCache.value[id]
  }

  function invalidate() {
    loaded.value = false
    items.value = []
  }

  function invalidateItem(id: string) {
    delete itemCache.value[id]
    delete itemOutfitsCache.value[id]
  }

  function invalidateAll() {
    invalidate()
    itemCache.value = {}
    itemOutfitsCache.value = {}
  }

  return {
    items, itemCache, itemOutfitsCache, loaded, loading,
    fetchItems, fetchItem, fetchItemOutfits,
    invalidate, invalidateItem, invalidateAll,
  }
})
