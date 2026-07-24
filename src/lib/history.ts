export interface RouteHistoryEntry {
  id: string
  origin: { lat: number; lng: number; text: string }
  destination: { lat: number; lng: number; text: string }
  distance: number
  duration: number
  timestamp: number
}

const STORAGE_KEY = 'eletroapp_route_history'
const MAX_ENTRIES = 20

export function getRouteHistory(): RouteHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRouteHistory(entry: Omit<RouteHistoryEntry, 'id' | 'timestamp'>): void {
  const history = getRouteHistory()
  const newEntry: RouteHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  history.unshift(newEntry)
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearRouteHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function removeRouteHistoryEntry(id: string): void {
  const history = getRouteHistory().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}
