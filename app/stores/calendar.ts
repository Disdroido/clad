export const useCalendarStore = defineStore('calendar', () => {
  const calendarCache = ref<Record<string, { dates: any[] }>>({})
  const loading = ref(false)

  function cacheKey(month: number, year: number) {
    return `${year}-${month}`
  }

  async function fetchCalendar(month: number, year: number) {
    const key = cacheKey(month, year)
    if (calendarCache.value[key]) return calendarCache.value[key].dates

    loading.value = true
    try {
      const data: any = await $fetch('/api/calendar', {
        params: { month, year }
      })
      calendarCache.value[key] = { dates: data.dates ?? [] }
      return data.dates
    } finally {
      loading.value = false
    }
  }

  function invalidate() {
    calendarCache.value = {}
  }

  function invalidateMonth(month: number, year: number) {
    delete calendarCache.value[cacheKey(month, year)]
  }

  return {
    calendarCache, loading,
    fetchCalendar,
    invalidate, invalidateMonth,
  }
})
