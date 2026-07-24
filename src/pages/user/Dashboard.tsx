import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { ChargingStation } from '../../lib/types'
import { MapView } from '../../components/map/MapView'
import { Button } from '../../components/ui/Button'
import {
  geocode,
  getRoute,
  getStationsNearRoute,
  formatDuration,
  formatDistance,
  haversineDistance,
  type NominatimResult,
  type RouteResult,
} from '../../lib/route'
import { addRouteHistory } from '../../lib/history'

export function UserDashboard() {
  useAuthStore()
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [showRoutePanel, setShowRoutePanel] = useState(false)
  const [allStations, setAllStations] = useState<ChargingStation[]>([])
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterPower, setFilterPower] = useState<number>(0)
  const [filterFreeOnly, setFilterFreeOnly] = useState(false)
  const [filterConnector, setFilterConnector] = useState('')

  const powerColor = (kw: number): string => {
    if (kw >= 100) return '#dc2626'
    if (kw >= 50) return '#f59e0b'
    if (kw >= 22) return '#2563eb'
    return '#10b981'
  }

  const [, setOriginMode] = useState<'gps' | 'manual' | null>(null)
  const [originText, setOriginText] = useState('')
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null)
  const [destText, setDestText] = useState('')
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null)
  const [originResults, setOriginResults] = useState<NominatimResult[]>([])
  const [destResults, setDestResults] = useState<NominatimResult[]>([])
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [routeStations, setRouteStations] = useState<ChargingStation[]>([])
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const originRef = useRef<HTMLDivElement>(null)
  const destRef = useRef<HTMLDivElement>(null)
  const [focusOrigin, setFocusOrigin] = useState(false)
  const [focusDest, setFocusDest] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setFocusOrigin(false)
      if (destRef.current && !destRef.current.contains(e.target as Node)) setFocusDest(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { fetchStations() }, [])

  // Process station from URL params (coming from StationDetail)
  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const name = searchParams.get('name')
    const city = searchParams.get('city')
    if (lat && lng && name) {
      const coords: [number, number] = [parseFloat(lat), parseFloat(lng)]
      setDestText(`${decodeURIComponent(name)} - ${decodeURIComponent(city || '')}`)
      setDestCoords(coords)
      setFlyToTarget(coords)
      // Auto-calculate route if origin exists
      if (originCoords) {
        const calcRoute = async () => {
          setRouteLoading(true)
          try {
            const r = await getRoute({ lat: originCoords[0], lng: originCoords[1] }, { lat: coords[0], lng: coords[1] })
            setRoute(r)
            const nearby = getStationsNearRoute(allStations, r.coordinates, 10)
            setRouteStations(nearby)
            setStations(nearby.length > 0 ? nearby : allStations)
          } catch { setRouteError('Não foi possível calcular a rota') }
          setRouteLoading(false)
        }
        calcRoute()
      }
    }
  }, [searchParams, originCoords, allStations])

  const fetchStations = async () => {
    const { data } = await supabase
      .from('charging_stations')
      .select('*, subscriber:profiles!charging_stations_subscriber_id_fkey(full_name, avatar_url)')
      .eq('is_active', true)
      .eq('is_approved', true)
    if (data) {
      const withRating = await Promise.all(
        data.map(async (station) => {
          const { data: reviews } = await supabase.from('reviews').select('rating').eq('station_id', station.id)
          const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null
          return { ...station, avg_rating: avg, review_count: reviews?.length || 0 }
        })
      )
      setAllStations(withRating as ChargingStation[])
      setStations(withRating as ChargingStation[])
    }
    setLoading(false)
  }

  const useGpsOrigin = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setOriginMode('gps')
        setOriginCoords(loc)
        setUserLocation(loc)
        setOriginText('Minha localização')
        setOriginResults([])
        setFlyToTarget(loc)
        setRoute(null)
        setRouteStations([])
        setStations(allStations)
      },
      () => { setOriginMode(null) }
    )
  }

  const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = async (q: string, setResults: (r: NominatimResult[]) => void) => {
    if (q.length < 2) { setResults([]); return }
    try { setResults(await geocode(q)) } catch { setResults([]) }
  }

  const handleOriginInput = (value: string) => {
    setOriginText(value)
    setOriginCoords(null)
    if (originTimer.current) clearTimeout(originTimer.current)
    originTimer.current = setTimeout(() => doSearch(value, setOriginResults), 500)
    setFocusOrigin(true)
  }

  const handleDestInput = (value: string) => {
    setDestText(value)
    setDestCoords(null)
    if (destTimer.current) clearTimeout(destTimer.current)
    destTimer.current = setTimeout(() => doSearch(value, setDestResults), 500)
    setFocusDest(true)
  }

  const selectOrigin = (r: NominatimResult) => {
    setOriginText(r.display_name.length > 40 ? r.display_name.substring(0, 40) + '...' : r.display_name)
    const coords: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)]
    setOriginCoords(coords)
    setFocusOrigin(false)
    setFlyToTarget(coords)
    setRoute(null)
    setRouteStations([])
    setStations(allStations)
  }

  const selectDest = (r: NominatimResult) => {
    setDestText(r.display_name.length > 40 ? r.display_name.substring(0, 40) + '...' : r.display_name)
    const coords: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)]
    setDestCoords(coords)
    setFocusDest(false)
    setFlyToTarget(coords)
  }

  const calculateRoute = async () => {
    if (!originCoords || !destCoords) { setRouteError('Selecione origem e destino'); return }
    setRouteLoading(true)
    setRouteError('')
    try {
      const r = await getRoute({ lat: originCoords[0], lng: originCoords[1] }, { lat: destCoords[0], lng: destCoords[1] })
      setRoute(r)
      const nearby = getStationsNearRoute(allStations, r.coordinates, 10)
      setRouteStations(nearby)
      setStations(nearby.length > 0 ? nearby : allStations)
      addRouteHistory({
        origin: { lat: originCoords[0], lng: originCoords[1], text: originText },
        destination: { lat: destCoords[0], lng: destCoords[1], text: destText },
        distance: r.distance,
        duration: r.duration,
      })
    } catch { setRouteError('Não foi possível calcular a rota') }
    setRouteLoading(false)
  }

  // Quando clica "Rota" num eletroposto: usa GPS se não tiver origem, calcula rota, centraliza mapa
  const handleStationRoute = async (station: ChargingStation) => {
    const stationCoords: [number, number] = [station.latitude, station.longitude]

    setDestText(`${station.name} - ${station.city}`)
    setDestCoords(stationCoords)

    let effectiveOrigin = originCoords
    if (!effectiveOrigin) {
      await new Promise<void>((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
            setOriginMode('gps')
            setOriginCoords(loc)
            setOriginText('Minha localização')
            setOriginResults([])
            effectiveOrigin = loc
            setFlyToTarget(loc)
            resolve()
          },
          () => {
            setRouteError('Não foi possível obter sua localização. Digite uma origem.')
            resolve()
          }
        )
      })
    }

    if (!effectiveOrigin) return

    setFlyToTarget(stationCoords)
    setRouteLoading(true)
    setRouteError('')
    try {
      const r = await getRoute(
        { lat: effectiveOrigin![0], lng: effectiveOrigin![1] },
        { lat: stationCoords[0], lng: stationCoords[1] }
      )
      setRoute(r)
      const nearby = getStationsNearRoute(allStations, r.coordinates, 10)
      setRouteStations(nearby)
      setStations(nearby.length > 0 ? nearby : allStations)
    } catch { setRouteError('Não foi possível calcular a rota') }
    setRouteLoading(false)
  }

  const clearRoute = () => {
    setOriginMode(null)
    setOriginText('')
    setOriginCoords(null)
    setDestText('')
    setDestCoords(null)
    setRoute(null)
    setRouteStations([])
    setStations(allStations)
    setRouteError('')
    setFlyToTarget(null)
  }

  const handleBoundsChange = () => {}

  const filteredStations = stations.filter(
    (s) =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.city.toLowerCase().includes(searchQuery.toLowerCase())) &&
      s.power_kw >= filterPower &&
      (!filterFreeOnly || s.is_free) &&
      (!filterConnector || s.connector_types?.includes(filterConnector))
  )

  const isStationOpen = (hours: string): boolean => {
    if (!hours || hours.toLowerCase().includes('24h')) return true
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const match = hours.match(/(\d{1,2})[h:](\d{2})?\s*[-a]\s*(\d{1,2})[h:](\d{2})?/i)
    if (!match) return true
    const openMin = parseInt(match[1]) * 60 + parseInt(match[2] || '0')
    const closeMin = parseInt(match[3]) * 60 + parseInt(match[4] || '0')
    return currentMinutes >= openMin && currentMinutes <= closeMin
  }

  const shareStation = async (station: ChargingStation) => {
    const url = `${window.location.origin}/dashboard/station/${station.id}`
    if (navigator.share) {
      try { await navigator.share({ title: station.name, text: `${station.name} - ${station.address}`, url }) } catch { /* ignore */ }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const getStationDistance = (station: ChargingStation): string | null => {
    if (!userLocation) return null
    const d = haversineDistance({ lat: userLocation[0], lng: userLocation[1] }, { lat: station.latitude, lng: station.longitude })
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Mobile route panel toggle */}
      <button onClick={() => setShowRoutePanel(!showRoutePanel)}
        className="md:hidden fixed bottom-20 left-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </button>

      {/* Sidebar panel */}
      <div className={`${showRoutePanel ? 'fixed inset-0 z-30 bg-black/50 md:bg-transparent md:relative' : 'hidden md:block'}`}
        onClick={() => setShowRoutePanel(false)}>
        <div className={`${showRoutePanel ? 'w-80' : 'w-96'} h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0`}
          onClick={(e) => e.stopPropagation()}>

        {/* ROTA */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Planejar Rota</h3>
          </div>
          <div className="space-y-3">

            {/* ORIGEM - input + GPS */}
            <div ref={originRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Origem</label>
              <div className="flex gap-1.5">
                <input type="text" placeholder="Digite a origem ou use GPS..."
                  value={originText} onChange={(e) => handleOriginInput(e.target.value)}
                  onFocus={() => originResults.length > 0 && setFocusOrigin(true)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                <button type="button" onClick={useGpsOrigin} title="Usar minha localização"
                  className="px-2.5 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                  </svg>
                </button>
              </div>
              {focusOrigin && originResults.length > 0 && (
                <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {originResults.map((r, i) => (
                    <button key={i} type="button" className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 border-b last:border-b-0"
                      onMouseDown={(e) => { e.preventDefault(); selectOrigin(r) }}>
                      <div className="font-medium">{r.display_name.split(',')[0]}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 truncate">{r.display_name.split(',').slice(1, 4).join(',')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DESTINO */}
            <div ref={destRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Destino</label>
              <input type="text" placeholder="Digite o destino..."
                value={destText} onChange={(e) => handleDestInput(e.target.value)}
                onFocus={() => destResults.length > 0 && setFocusDest(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              {focusDest && destResults.length > 0 && (
                <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {destResults.map((r, i) => (
                    <button key={i} type="button" className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 border-b last:border-b-0"
                      onMouseDown={(e) => { e.preventDefault(); selectDest(r) }}>
                      <div className="font-medium">{r.display_name.split(',')[0]}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 truncate">{r.display_name.split(',').slice(1, 4).join(',')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {routeError && <p className="text-xs text-red-600">{routeError}</p>}

            <div className="flex gap-2">
              <Button variant="primary" className="flex-1 text-xs py-2" onClick={calculateRoute} loading={routeLoading}
                disabled={!originCoords || !destCoords}>Calcular rota</Button>
              {route && <Button variant="secondary" className="text-xs py-2" onClick={clearRoute}>Limpar</Button>}
            </div>

            {route && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-3.5 space-y-2 border border-blue-100 dark:border-blue-800/30">
                <div className="flex justify-between items-center"><span className="text-xs text-blue-600 dark:text-blue-400">Distancia</span><span className="text-sm font-bold text-blue-900 dark:text-blue-200">{formatDistance(route.distance)}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-blue-600 dark:text-blue-400">Duracao</span><span className="text-sm font-bold text-blue-900 dark:text-blue-200">{formatDuration(route.duration)}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-blue-600 dark:text-blue-400">Eletropostos na rota</span><span className="text-sm font-bold text-blue-600 dark:text-blue-400">{routeStations.length}</span></div>
                <div className="h-px bg-blue-200 dark:bg-blue-700/50" />
                <div className="flex justify-between items-center"><span className="text-xs text-gray-500 dark:text-gray-400">Custo estimado</span><span className="text-sm font-semibold text-gray-900 dark:text-white">R$ {((route.distance / 100) * 18 * 1.70).toFixed(2)}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {route ? `Na Rota (${routeStations.length})` : `Eletropostos (${stations.length})`}
            </h2>
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
              {filteredStations.length}
            </span>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar por nome ou cidade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-gray-50 dark:bg-gray-800 dark:text-white placeholder-gray-400" />
          </div>
        </div>

        {/* Filtros avançados */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filtros</span>
            </div>
            {(filterPower > 0 || filterFreeOnly || filterConnector) && (
              <button onClick={() => { setFilterPower(0); setFilterFreeOnly(false); setFilterConnector('') }}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">Limpar</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Potencia min</label>
              <select value={filterPower} onChange={(e) => setFilterPower(Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
                <option value={0}>Todas</option>
                <option value={7}>7 kW</option>
                <option value={11}>11 kW</option>
                <option value={22}>22 kW</option>
                <option value={50}>50 kW</option>
                <option value={100}>100 kW</option>
                <option value={150}>150 kW</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Conector</label>
              <select value={filterConnector} onChange={(e) => setFilterConnector(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
                <option value="">Todos</option>
                <option value="CCS">CCS</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="Type 2">Type 2</option>
                <option value="GB/T">GB/T</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filterFreeOnly} onChange={(e) => setFilterFreeOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Apenas gratuitos</span>
          </label>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Carregando eletropostos...</span>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Nenhum eletroposto encontrado</p>
            </div>
          ) : (
            filteredStations.map((station) => (
              <div key={station.id}
                className={`group p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedStation?.id === station.id
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 shadow-md'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }`}
                onClick={() => setSelectedStation(station)}>
                
                {/* Top row: image or placeholder + info */}
                <div className="flex gap-3">
                  {station.image_url ? (
                    <img src={station.image_url} alt={station.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${powerColor(station.power_kw)}15` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: powerColor(station.power_kw) }}>
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{station.name}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                        isStationOpen(station.operating_hours)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isStationOpen(station.operating_hours) ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{station.address || station.city}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: `${powerColor(station.power_kw)}15` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: powerColor(station.power_kw) }} />
                        <span className="text-[10px] font-bold" style={{ color: powerColor(station.power_kw) }}>{station.power_kw}kW</span>
                      </div>
                      {station.is_free ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md font-bold">GRATIS</span>
                      ) : (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">R${station.price_per_kwh}/kWh</span>
                      )}
                      {userLocation && (
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">{getStationDistance(station)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {station.connector_types?.slice(0, 3).map((ct) => (
                        <span key={ct} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded font-medium">{ct}</span>
                      ))}
                      {station.avg_rating && (
                        <span className="text-[10px] text-amber-500 ml-auto flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          {station.avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini map */}
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 h-16 bg-gray-100 dark:bg-gray-800 relative">
                  <div className="w-full h-full"
                    style={{
                      backgroundImage: `url('https://tile.openstreetmap.org/14/${Math.floor((station.longitude + 180) / 360 * Math.pow(2, 14))}/${Math.floor((1 - Math.log(Math.tan(station.latitude * Math.PI / 180) + 1 / Math.cos(station.latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 14))}.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style={{ background: powerColor(station.power_kw) }}>
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5 mt-3">
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleStationRoute(station) }}
                    className="text-[11px] py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium flex-1 flex items-center justify-center gap-1 active:scale-95">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Rota
                  </button>
                  <a href={`https://www.waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`}
                    target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="text-[11px] py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all text-center font-medium flex-1 flex items-center justify-center gap-1 active:scale-95">
                    Waze
                  </a>
                  <button type="button" onClick={(e) => { e.stopPropagation(); shareStation(station) }}
                    className="text-[11px] py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                    title="Compartilhar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <Link to={`/dashboard/station/${station.id}`} className="text-[11px] py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center font-medium flex-1 active:scale-95"
                    onClick={(e) => e.stopPropagation()}>Detalhes</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>

      <div className="flex-1 relative">
        <MapView stations={filteredStations} onBoundsChange={handleBoundsChange} onStationClick={setSelectedStation}
          routeCoordinates={route?.coordinates} routeOrigin={originCoords ?? undefined} routeDestination={destCoords ?? undefined}
          flyToTarget={flyToTarget} />
        <div className="absolute top-4 left-4 z-[1000] hidden sm:block">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-2.5">
            <div className="flex items-center gap-4 text-sm">
              <div><span className="text-gray-400 dark:text-gray-500">Total:</span><span className="ml-1 font-bold text-gray-900 dark:text-white">{allStations.length}</span></div>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <div><span className="text-gray-400 dark:text-gray-500">Mostrando:</span><span className="ml-1 font-bold text-gray-900 dark:text-white">{filteredStations.length}</span></div>
              {routeStations.length > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                  <div><span className="text-gray-400 dark:text-gray-500">Na rota:</span><span className="ml-1 font-bold text-blue-600 dark:text-blue-400">{routeStations.length}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}