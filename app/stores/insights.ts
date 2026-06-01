export const useInsightsStore = defineStore('insights', () => {
  const analytics = ref<any>(null)
  const gapData = ref<any>(null)
  const loaded = ref(false)
  const loading = ref(false)
  const gapLoading = ref(false)

  async function fetchAnalytics(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      analytics.value = await $fetch('/api/analytics')
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function fetchGapAnalysis() {
    gapLoading.value = true
    try {
      gapData.value = await $fetch('/api/analytics/gaps', { method: 'POST' })
    } finally {
      gapLoading.value = false
    }
  }

  function invalidate() {
    loaded.value = false
    analytics.value = null
    gapData.value = null
  }

  return {
    analytics, gapData, loaded, loading, gapLoading,
    fetchAnalytics, fetchGapAnalysis, invalidate,
  }
})
