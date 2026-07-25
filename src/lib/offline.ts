import type { ChargingStation } from './types'

const STATIONS_CACHE_KEY = 'eletroapp_stations_cache'
const CACHE_TIMESTAMP_KEY = 'eletroapp_cache_timestamp'
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function getCachedStations(): ChargingStation[] | null {
  try {
    const ts = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!ts) return null
    const age = Date.now() - parseInt(ts, 10)
    if (age > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(STATIONS_CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
      return null
    }
    const raw = localStorage.getItem(STATIONS_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedStations(stations: ChargingStation[]): void {
  try {
    localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify(stations))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch { /* quota exceeded, ignore */ }
}

export function clearStationsCache(): void {
  localStorage.removeItem(STATIONS_CACHE_KEY)
  localStorage.removeItem(CACHE_TIMESTAMP_KEY)
}
