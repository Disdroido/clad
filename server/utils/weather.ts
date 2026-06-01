import { requireServerEnv } from './runtime-env'
import type { H3Event } from 'h3'

export interface WeatherData {
  temperature: number       // °F
  feelsLike: number         // °F — use this for clothing decisions (feels-like > actual)
  condition: string         // "Sunny", "Partly cloudy", etc.
  conditionCode: number     // WeatherAPI condition code
  iconUrl: string           // "//cdn.weatherapi.com/weather/64x64/day/113.png"
  humidity: number
  locationName: string      // "San Francisco"
  lastUpdated: string       // ISO timestamp from API
}

/** Internal — matches WeatherAPI.com /current.json response shape. */
interface WeatherApiResponse {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  current: {
    temp_f: number
    feelslike_f: number
    condition: {
      text: string
      icon: string
      code: number
    }
    humidity: number
    wind_mph: number
    wind_dir: string
    pressure_mb: number
    precip_mm: number
    cloud: number
    is_day: number
    uv: number
    gust_mph: number
    last_updated: string
  }
}

/**
 * Fetch current weather for a lat/lon pair from WeatherAPI.com.
 * Returns null on any failure (graceful degradation per D-05).
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number,
  event?: H3Event,
): Promise<WeatherData | null> {
  try {
    const apiKey = requireServerEnv('weatherApiKey', event)
    const raw = await $fetch<WeatherApiResponse>(
      'https://api.weatherapi.com/v1/current.json',
      { params: { key: apiKey, q: `${lat},${lon}` } },
    )
    return {
      temperature: raw.current.temp_f,
      feelsLike: raw.current.feelslike_f,
      condition: raw.current.condition.text,
      conditionCode: raw.current.condition.code,
      iconUrl: raw.current.condition.icon,
      humidity: raw.current.humidity,
      locationName: raw.location.name,
      lastUpdated: raw.current.last_updated,
    }
  } catch {
    return null // Graceful degradation (D-05)
  }
}

/**
 * Fetch current weather using IP-based resolution.
 * Accepts an explicit IP string (e.g., from x-forwarded-for header).
 * Per Pitfall 4: do NOT use auto:ip on Cloudflare Workers — it resolves the
 * datacenter, not the user.
 */
export async function fetchWeatherByIp(
  ipAddress: string,
  event?: H3Event,
): Promise<WeatherData | null> {
  try {
    const apiKey = requireServerEnv('weatherApiKey', event)
    const raw = await $fetch<WeatherApiResponse>(
      'https://api.weatherapi.com/v1/current.json',
      { params: { key: apiKey, q: ipAddress } },
    )
    return {
      temperature: raw.current.temp_f,
      feelsLike: raw.current.feelslike_f,
      condition: raw.current.condition.text,
      conditionCode: raw.current.condition.code,
      iconUrl: raw.current.condition.icon,
      humidity: raw.current.humidity,
      locationName: raw.location.name,
      lastUpdated: raw.current.last_updated,
    }
  } catch {
    return null
  }
}
