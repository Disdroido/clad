// GET /api/weather/current?lat=37.77&lon=-122.42
import { fetchCurrentWeather } from '../../utils/weather'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = parseFloat(query.lat as string)
  const lon = parseFloat(query.lon as string)

  if (isNaN(lat) || isNaN(lon)) {
    return null // No valid coords — graceful degradation
  }

  return await fetchCurrentWeather(lat, lon, event)
})
