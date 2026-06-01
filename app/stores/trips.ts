export const useTripStore = defineStore('trips', () => {
  const trips = ref<any[]>([])
  const tripCache = ref<Record<string, any>>({})
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchTrips(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const data: any = await $fetch('/api/trips')
      trips.value = data ?? []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function fetchTrip(id: string) {
    if (tripCache.value[id]) return tripCache.value[id]
    const data: any = await $fetch(`/api/trips/${id}`)
    tripCache.value[id] = data
    return data
  }

  function invalidate() {
    loaded.value = false
    trips.value = []
  }

  function invalidateTrip(id: string) {
    delete tripCache.value[id]
  }

  function invalidateAll() {
    invalidate()
    tripCache.value = {}
  }

  return {
    trips, tripCache, loaded, loading,
    fetchTrips, fetchTrip,
    invalidate, invalidateTrip, invalidateAll,
  }
})
