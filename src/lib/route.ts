export interface GeoPoint {
  lat: number
  lng: number
}

export interface RouteResult {
  coordinates: [number, number][]
  distance: number
  duration: number
}

export interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

export async function geocode(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=br&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EletroApp/1.0 (contato@eletroapp.com)' }
  })
  if (!res.ok) return []
  const results = await res.json()
  return results.filter((r: NominatimResult) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    return lat >= -34 && lat <= 5 && lng >= -75 && lng <= -35
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EletroApp/1.0 (contato@eletroapp.com)' }
  })
  if (!res.ok) return ''
  const data = await res.json()
  return data.display_name || ''
}

export async function getRoute(origin: GeoPoint, destination: GeoPoint, alternatives?: boolean): Promise<RouteResult | RouteResult[]> {
  const altParam = alternatives ? '&alternatives=true' : ''
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson${altParam}`
  const res = await fetch(url)
  const data = await res.json()

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Rota não encontrada')
  }

  if (alternatives && data.routes.length > 1) {
    return data.routes.map((route: any) => ({
      coordinates: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
      distance: route.distance,
      duration: route.duration,
    }))
  }

  const route = data.routes[0]
  return {
    coordinates: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
    distance: route.distance,
    duration: route.duration,
  }
}

export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function getStationsNearRoute<T extends { latitude: number; longitude: number }>(
  stations: T[],
  routeCoords: [number, number][],
  maxDistanceKm: number = 5
): T[] {
  const sampled = sampleRoute(routeCoords, 200)
  return stations.filter((station) => {
    const point: GeoPoint = { lat: station.latitude, lng: station.longitude }
    return sampled.some((rp) => haversineDistance(point, rp) <= maxDistanceKm)
  })
}

function sampleRoute(coords: [number, number][], maxPoints: number): GeoPoint[] {
  if (coords.length <= maxPoints) {
    return coords.map((c) => ({ lat: c[0], lng: c[1] }))
  }
  const step = Math.floor(coords.length / maxPoints)
  const sampled: GeoPoint[] = []
  for (let i = 0; i < coords.length; i += step) {
    sampled.push({ lat: coords[i][0], lng: coords[i][1] })
  }
  return sampled
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}
