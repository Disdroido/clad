import { ref } from 'vue'

const LOCATION_CACHE_KEY = 'clad_location'
const LOCATION_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CachedCoords {
  lat: number
  lon: number
  timestamp: number
}

export function useGeolocation() {
  const coords = ref<{ lat: number; lon: number } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function requestLocation(): Promise<{ lat: number; lon: number } | null> {
    loading.value = true
    error.value = null

    // 1. Check localStorage cache first (avoids repeated browser prompts per D-02)
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY)
      if (cached) {
        const parsed: CachedCoords = JSON.parse(cached)
        if (Date.now() - parsed.timestamp < LOCATION_TTL_MS) {
          coords.value = { lat: parsed.lat, lon: parsed.lon }
          loading.value = false
          return coords.value
        }
        // Expired — remove stale entry
        localStorage.removeItem(LOCATION_CACHE_KEY)
      }
    } catch {
      // Corrupted cache — ignore
    }

    // 2. Browser geolocation API (primary per D-02)
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,   // don't drain battery
            timeout: 5000,               // 5s max wait
            maximumAge: 300000,           // accept 5-min-old positions
          })
        })
        const result = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }
        // Cache for future visits
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
          ...result,
          timestamp: Date.now(),
        }))
        coords.value = result
        loading.value = false
        return result
      } catch (geoErr: any) {
        // Permission denied, timeout, etc. — IP fallback on server (03-01 handles this)
        error.value = geoErr?.message || 'Geolocation failed'
        loading.value = false
        return null
      }
    }

    // 3. No geolocation API available — server will use IP fallback
    loading.value = false
    return null
  }

  return { coords, loading, error, requestLocation }
}
