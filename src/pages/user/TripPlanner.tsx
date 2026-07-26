import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { MapView } from '../../components/map/MapView'
import type { ChargingStation } from '../../lib/types'
import { geocode, getRoute, getStationsNearRoute, formatDuration, formatDistance, haversineDistance, type NominatimResult, type RouteResult, type GeoPoint } from '../../lib/route'
import { getTravelHistory, addTravelHistory, clearTravelHistory, formatTravelDate, type TravelHistoryEntry } from '../../lib/history'
import { getCachedStations, setCachedStations } from '../../lib/offline'
import { addTripPoints } from '../../lib/loyalty'

const EV_CARS = [
  { name: 'Tesla Model 3', autonomy: 510, battery: 60, connector: 'CCS' },
  { name: 'BYD Dolphin', autonomy: 490, battery: 60.4, connector: 'CCS' },
  { name: 'BYD Han', autonomy: 520, battery: 85.4, connector: 'CCS' },
  { name: 'Chevrolet Bolt', autonomy: 416, battery: 66, connector: 'CCS' },
  { name: 'Nissan Leaf', autonomy: 270, battery: 40, connector: 'CHAdeMO' },
  { name: 'Hyundai Ioniq 5', autonomy: 507, battery: 77.4, connector: 'CCS' },
  { name: 'Kia EV6', autonomy: 528, battery: 77.4, connector: 'CCS' },
  { name: 'Volkswagen ID.4', autonomy: 452, battery: 77, connector: 'CCS' },
  { name: 'Volvo EX30', autonomy: 450, battery: 69, connector: 'CCS' },
  { name: 'Peugeot e-208', autonomy: 362, battery: 51, connector: 'CCS' },
  { name: 'Fiat 500e', autonomy: 320, battery: 42, connector: 'CCS' },
  { name: 'Citroën ë-C4', autonomy: 360, battery: 50, connector: 'CCS' },
  { name: 'BMW iX3', autonomy: 460, battery: 74, connector: 'CCS' },
  { name: 'Mercedes EQS', autonomy: 770, battery: 107.8, connector: 'CCS' },
  { name: 'Outro', autonomy: 400, battery: 60, connector: 'CCS' },
]

interface RecommendedStop {
  station: ChargingStation
  distanceFromStart: number
  distanceFromPrev: number
  estimatedArrivalSoc: number
  estimatedDepartureSoc: number
  chargingTimeMin: number
  segmentIndex: number
}

function getCumulativeDistances(routeCoords: [number, number][]): number[] {
  const distances = [0]
  for (let i = 1; i < routeCoords.length; i++) {
    const prev = { lat: routeCoords[i - 1][0], lng: routeCoords[i - 1][1] }
    const curr = { lat: routeCoords[i][0], lng: routeCoords[i][1] }
    distances.push(distances[i - 1] + haversineDistance(prev, curr))
  }
  return distances
}

function getStationAtDistance(
  routeCoords: [number, number][],
  cumulativeDist: number[],
  targetKm: number,
  stations: ChargingStation[],
  maxDeviationKm: number,
  maxPricePerKwh?: number
): ChargingStation | null {
  let bestStation: ChargingStation | null = null
  let bestScore = -Infinity

  for (const station of stations) {
    if (maxPricePerKwh !== undefined && !station.is_free && station.price_per_kwh > maxPricePerKwh) continue

    const stationPoint: GeoPoint = { lat: station.latitude, lng: station.longitude }
    let minDeviation = Infinity
    let bestIdx = 0

    for (let i = 0; i < routeCoords.length; i += 5) {
      const rp: GeoPoint = { lat: routeCoords[i][0], lng: routeCoords[i][1] }
      const dev = haversineDistance(stationPoint, rp)
      if (dev < minDeviation) {
        minDeviation = dev
        bestIdx = i
      }
    }

    if (minDeviation > maxDeviationKm) continue

    const stationDistOnRoute = cumulativeDist[bestIdx] || 0
    const distFromTarget = Math.abs(stationDistOnRoute - targetKm)
    const powerScore = Math.min(station.power_kw / 10, 10)
    const priceBonus = station.is_free ? 3 : (maxPricePerKwh ? (maxPricePerKwh - station.price_per_kwh) * 0.5 : 0)
    const subscriberBoost = station.subscriber_id ? 4 : 0
    const score = powerScore * 2 + priceBonus + subscriberBoost - distFromTarget * 0.5 - minDeviation * 3

    if (score > bestScore) {
      bestScore = score
      bestStation = station
    }
  }

  return bestStation
}

export function TripPlanner() {
  const { user } = useAuth()
  const [allStations, setAllStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCar, setSelectedCar] = useState(EV_CARS[0])
  const [soc, setSoc] = useState(80)
  const [minSoc, setMinSoc] = useState(20)
  const [customAutonomy, setCustomAutonomy] = useState(400)
  const [maxPricePerKwh, setMaxPricePerKwh] = useState<number>(0)

  const [originText, setOriginText] = useState('')
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null)
  const [originResults, setOriginResults] = useState<NominatimResult[]>([])
  const [destText, setDestText] = useState('')
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null)
  const [destResults, setDestResults] = useState<NominatimResult[]>([])
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [altRoute, setAltRoute] = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [routeStations, setRouteStations] = useState<ChargingStation[]>([])
  const [recommendedStops, setRecommendedStops] = useState<RecommendedStop[]>([])
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null)
  const [history, setHistory] = useState<TravelHistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'plan' | 'history'>('plan')

  const [focusOrigin, setFocusOrigin] = useState(false)
  const [focusDest, setFocusDest] = useState(false)
  const originRef = useRef<HTMLDivElement>(null)
  const destRef = useRef<HTMLDivElement>(null)
  const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setFocusOrigin(false)
      if (destRef.current && !destRef.current.contains(e.target as Node)) setFocusDest(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { 
    fetchStations() 
    if (user) {
      getTravelHistory(user.id).then(setHistory)
    }
  }, [user])

  const fetchStations = async () => {
    const cached = getCachedStations()
    if (cached && cached.length > 0) {
      setAllStations(cached)
      setLoading(false)
    }

    const { data } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
    if (data) {
      const stations = data as ChargingStation[]
      setAllStations(stations)
      setCachedStations(stations)
    }
    setLoading(false)
  }

  const autonomy = selectedCar.name === 'Outro'
    ? customAutonomy
    : (selectedCar.autonomy * soc) / 100
  const usableRange = autonomy
  const maxChargeRange = autonomy * (1 - minSoc / 100)

  const doSearch = async (q: string, setResults: (r: NominatimResult[]) => void) => {
    if (q.length < 2) { setResults([]); return }
    try { setResults(await geocode(q)) } catch { setResults([]) }
  }

  const handleOriginInput = (value: string) => {
    setOriginText(value)
    setOriginCoords(null)
    if (originTimer.current) clearTimeout(originTimer.current)
    originTimer.current = setTimeout(() => doSearch(value, setOriginResults), 400)
    setFocusOrigin(true)
  }

  const handleDestInput = (value: string) => {
    setDestText(value)
    setDestCoords(null)
    if (destTimer.current) clearTimeout(destTimer.current)
    destTimer.current = setTimeout(() => doSearch(value, setDestResults), 400)
    setFocusDest(true)
  }

  const selectOrigin = (r: NominatimResult) => {
    setOriginText(r.display_name.split(',')[0])
    setOriginCoords([parseFloat(r.lat), parseFloat(r.lon)])
    setFocusOrigin(false)
    setFlyToTarget([parseFloat(r.lat), parseFloat(r.lon)])
  }

  const selectDest = (r: NominatimResult) => {
    setDestText(r.display_name.split(',')[0])
    setDestCoords([parseFloat(r.lat), parseFloat(r.lon)])
    setFocusDest(false)
    setFlyToTarget([parseFloat(r.lat), parseFloat(r.lon)])
  }

  const useGps = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setOriginCoords(loc)
        setOriginText('Minha localização')
        setFlyToTarget(loc)
      },
      () => {}
    )
  }

  const calculateRoute = async () => {
    if (!originCoords || !destCoords) return
    setRouteLoading(true)
    setRecommendedStops([])
    setAltRoute(null)
    try {
      const result = await getRoute({ lat: originCoords[0], lng: originCoords[1] }, { lat: destCoords[0], lng: destCoords[1] }, compareMode)
      
      if (Array.isArray(result)) {
        setRoute(result[0])
        if (result.length > 1) setAltRoute(result[1])
      } else {
        setRoute(result)
      }

      const activeRoute = Array.isArray(result) ? result[0] : result
      const nearby = getStationsNearRoute(allStations, activeRoute.coordinates, 10)
      setRouteStations(nearby)

      const distanceKm = activeRoute.distance / 1000
      const needsCharging = distanceKm > usableRange * 0.85

      if (!needsCharging || nearby.length === 0) {
        setRecommendedStops([])
        return
      }

      const cumDist = getCumulativeDistances(activeRoute.coordinates)
      const totalDistance = cumDist[cumDist.length - 1]
      const stops: RecommendedStop[] = []
      const usedStationIds = new Set<string>()

      const numStopsNeeded = Math.ceil(distanceKm / maxChargeRange)
      const segmentLength = totalDistance / (numStopsNeeded + 1)

      for (let i = 1; i <= numStopsNeeded; i++) {
        const targetKm = segmentLength * i
        const availableStations = nearby.filter(s => !usedStationIds.has(s.id))
        const station = getStationAtDistance(activeRoute.coordinates, cumDist, targetKm, availableStations, 10, maxPricePerKwh || undefined)

        if (station) {
          usedStationIds.add(station.id)
          const stationPoint: GeoPoint = { lat: station.latitude, lng: station.longitude }
          let stationIdx = 0
          let minDev = Infinity
          for (let j = 0; j < activeRoute.coordinates.length; j += 5) {
            const rp: GeoPoint = { lat: activeRoute.coordinates[j][0], lng: activeRoute.coordinates[j][1] }
            const dev = haversineDistance(stationPoint, rp)
            if (dev < minDev) { minDev = dev; stationIdx = j }
          }
          const distOnRoute = cumDist[stationIdx] || targetKm
          const prevDist = stops.length > 0 ? stops[stops.length - 1].distanceFromStart : 0
          const distFromPrev = distOnRoute - prevDist
          const socAtArrival = Math.max(minSoc, soc - (distFromPrev / usableRange) * soc)
          const chargeNeeded = Math.min(100, socAtArrival + (distFromPrev / usableRange) * 30)
          const chargeTimeMin = Math.round(((chargeNeeded - socAtArrival) / 100) * (selectedCar.battery / (station.power_kw / 100)) * 60)

          stops.push({
            station,
            distanceFromStart: distOnRoute,
            distanceFromPrev: distFromPrev,
            estimatedArrivalSoc: Math.round(socAtArrival),
            estimatedDepartureSoc: Math.min(90, Math.round(chargeNeeded)),
            chargingTimeMin: Math.max(15, Math.min(60, chargeTimeMin)),
            segmentIndex: i,
          })
        }
      }

      setRecommendedStops(stops)

      if (user) {
        await addTravelHistory(user.id, {
          origin: originText,
          destination: destText,
          origin_coords: originCoords,
          dest_coords: destCoords,
          distance_km: activeRoute.distance / 1000,
          duration_minutes: Math.round(activeRoute.duration / 60),
          charging_stops: stops.length,
          car_name: selectedCar.name,
        })
        setHistory(await getTravelHistory(user.id))
        await addTripPoints(user.id, activeRoute.distance / 1000, stops.length, stops.map(s => s.station.id))
      }
    } catch {}
    setRouteLoading(false)
  }

  const distanceKm = route ? route.distance / 1000 : 0
  const needsCharging = distanceKm > usableRange * 0.85
  const chargeStopsNeeded = needsCharging ? Math.ceil(distanceKm / maxChargeRange) : 0

  const totalChargingTime = recommendedStops.reduce((acc, s) => acc + s.chargingTimeMin, 0)

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-96 h-full glass-strong overflow-y-auto flex-shrink-0 hidden md:block" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderBottom: 'none', boxShadow: 'none' }}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl glass-btn flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">Planejador de Viagem</h1>
              <p className="text-[11px] text-gray-400">Planeje com autonomia real do seu carro</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setActiveTab('plan')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'plan' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            Planejar
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            Histórico {history.length > 0 && <span className="ml-1 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 rounded-full">{history.length}</span>}
          </button>
        </div>

        {activeTab === 'history' ? (
          <div className="p-4">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400">Nenhuma viagem registrada</p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">As rotas planejadas aparecerão aqui</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-400">{history.length} viagem(ns)</span>
                  <button onClick={() => { if (user) clearTravelHistory(user.id).then(() => setHistory([])) }}
                    className="text-[10px] text-red-500 hover:text-red-600 font-medium">Limpar tudo</button>
                </div>
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{entry.origin}</p>
                          <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 my-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{entry.destination}</p>
                        </div>
                        <button onClick={() => {
                          setOriginText(entry.origin); setOriginCoords(entry.origin_coords as [number, number])
                          setDestText(entry.destination); setDestCoords(entry.dest_coords as [number, number])
                          setActiveTab('plan')
                        }} className="text-[10px] text-blue-600 dark:text-blue-400 font-medium ml-2 flex-shrink-0">Repetir</button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>{entry.distance_km?.toFixed(0)}km</span>
                        <span>{entry.duration_minutes}min</span>
                        {entry.charging_stops > 0 && <span className="text-amber-500">{entry.charging_stops} parada(s)</span>}
                        <span className="ml-auto">{formatTravelDate(entry.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
        <>
          <div className="p-4 border-b border-white/10 dark:border-white/5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seu Veículo</h3>
          <select value={selectedCar.name} onChange={(e) => {
            const car = EV_CARS.find(c => c.name === e.target.value)
            if (car) setSelectedCar(car)
          }} className="w-full px-3 py-2.5 glass-input text-sm dark:text-white focus:ring-0 outline-none">
            {EV_CARS.map(car => <option key={car.name} value={car.name}>{car.name}</option>)}
          </select>

          {selectedCar.name === 'Outro' && (
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase">Autonomia (km)</label>
              <input type="number" value={customAutonomy} onChange={(e) => setCustomAutonomy(Number(e.target.value))}
                className="w-full px-3 py-2 glass-input text-sm dark:text-white focus:ring-0 outline-none" />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-medium text-gray-400 uppercase">Carga Atual (SOC)</label>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{soc}%</span>
            </div>
            <input type="range" min={10} max={100} value={soc} onChange={(e) => setSoc(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-medium text-gray-400 uppercase">SOC Mínimo</label>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{minSoc}%</span>
            </div>
            <input type="range" min={5} max={50} value={minSoc} onChange={(e) => setMinSoc(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-medium text-gray-400 uppercase">Preço Máx. (R$/kWh)</label>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{maxPricePerKwh === 0 ? 'Todos' : `R$${maxPricePerKwh}`}</span>
            </div>
            <input type="range" min={0} max={5} step={0.5} value={maxPricePerKwh} onChange={(e) => setMaxPricePerKwh(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Todos</span>
              <span>R$5.00</span>
            </div>
          </div>

          <div className="glass-card p-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{usableRange.toFixed(0)}</div>
                <div className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">km de autonomia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{chargeStopsNeeded}</div>
                <div className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">paradas necessárias</div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Planning */}
        <div className="p-4 border-b border-white/10 dark:border-white/5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rota</h3>
          <div ref={originRef} className="relative">
            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Origem</label>
            <div className="flex gap-1.5">
              <input type="text" placeholder="Digite ou use GPS..."
                value={originText} onChange={(e) => handleOriginInput(e.target.value)}
                onFocus={() => originResults.length > 0 && setFocusOrigin(true)}
                className="flex-1 px-3 py-2 glass-input text-sm dark:text-white focus:ring-0 outline-none" />
              <button type="button" onClick={useGps} title="Usar minha localização"
                className="px-2.5 py-2 glass-btn-secondary text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
              </button>
            </div>
            {focusOrigin && originResults.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full glass-panel shadow-lg max-h-48 overflow-y-auto">
                {originResults.map((r, i) => (
                  <button key={i} type="button" className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50/80 dark:hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    onMouseDown={(e) => { e.preventDefault(); selectOrigin(r) }}>
                    <div className="font-medium">{r.display_name.split(',')[0]}</div>
                    <div className="text-gray-400 text-[10px] mt-0.5 truncate">{r.display_name.split(',').slice(1, 4).join(',')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={destRef} className="relative">
            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Destino</label>
            <input type="text" placeholder="Para onde vai?"
              value={destText} onChange={(e) => handleDestInput(e.target.value)}
              onFocus={() => destResults.length > 0 && setFocusDest(true)}
              className="w-full px-3 py-2 glass-input text-sm dark:text-white focus:ring-0 outline-none" />
            {focusDest && destResults.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full glass-panel shadow-lg max-h-48 overflow-y-auto">
                {destResults.map((r, i) => (
                  <button key={i} type="button" className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50/80 dark:hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    onMouseDown={(e) => { e.preventDefault(); selectDest(r) }}>
                    <div className="font-medium">{r.display_name.split(',')[0]}</div>
                    <div className="text-gray-400 text-[10px] mt-0.5 truncate">{r.display_name.split(',').slice(1, 4).join(',')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 px-1 py-1.5 cursor-pointer">
            <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Comparar rotas (rápida vs econômica)</span>
          </label>

          <button onClick={calculateRoute} disabled={!originCoords || !destCoords || routeLoading}
            className="w-full py-2.5 glass-btn text-white font-medium text-sm disabled:opacity-50">
            {routeLoading ? 'Calculando...' : 'Planejar Viagem'}
          </button>
        </div>

        {/* Route Summary */}
        {route && (
          <div className="p-4 border-b border-white/10 dark:border-white/5">
            <div className={`glass-card p-3.5 text-xs ${!needsCharging ? '!border-green-200/50 dark:!border-green-500/20 !bg-green-50/80 dark:!bg-green-900/15 text-green-800 dark:text-green-300' : '!border-amber-200/50 dark:!border-amber-500/20 !bg-amber-50/80 dark:!bg-amber-900/15 text-amber-800 dark:text-amber-300'}`}>
              <p className="font-medium mb-1">{!needsCharging ? 'Trajeto Direto' : `${chargeStopsNeeded} parada(s) necessária(s)`}</p>
              <p>{!needsCharging
                ? `Autonomia de ${usableRange.toFixed(0)}km é suficiente para ${distanceKm.toFixed(0)}km.`
                : `Autonomia de ${usableRange.toFixed(0)}km para ${distanceKm.toFixed(0)}km de distância.`
              }</p>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Distância total</span><span className="font-semibold text-gray-900 dark:text-white">{formatDistance(route.distance)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tempo de direção</span><span className="font-semibold text-gray-900 dark:text-white">{formatDuration(route.duration)}</span></div>
              {recommendedStops.length > 0 && (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">Tempo de recarga</span><span className="font-semibold text-amber-600 dark:text-amber-400">~{totalChargingTime}min</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tempo total estimado</span><span className="font-semibold text-gray-900 dark:text-white">{formatDuration(route.duration + totalChargingTime * 60)}</span></div>
                </>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Eletropostos na rota</span><span className="font-semibold text-blue-600 dark:text-blue-400">{routeStations.length}</span></div>
            </div>
          </div>
        )}

        {/* Route Comparison */}
        {route && altRoute && (
          <div className="p-4 border-b border-white/10 dark:border-white/5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Comparação de Rotas</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3 !border-blue-400/50 dark:!border-blue-500/30 !bg-blue-50/80 dark:!bg-blue-900/15">
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">ROTA PRINCIPAL</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Distância</span><span className="font-semibold text-gray-900 dark:text-white">{formatDistance(route.distance)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tempo</span><span className="font-semibold text-gray-900 dark:text-white">{formatDuration(route.duration)}</span></div>
                </div>
              </div>
              <div className="glass-card p-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">ROTA ALTERNATIVA</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Distância</span><span className="font-semibold text-gray-900 dark:text-white">{formatDistance(altRoute.distance)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tempo</span><span className="font-semibold text-gray-900 dark:text-white">{formatDuration(altRoute.duration)}</span></div>
                </div>
              </div>
            </div>
            {(() => {
              const diffKm = Math.abs(route.distance - altRoute.distance) / 1000
              const diffMin = Math.abs(route.duration - altRoute.duration) / 60
              const faster = route.duration < altRoute.duration ? 'Principal' : 'Alternativa'
              const shorter = route.distance < altRoute.distance ? 'Principal' : 'Alternativa'
              return (
                <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  Rota {faster} é <span className="font-bold text-blue-600 dark:text-blue-400">{diffMin.toFixed(0)}min</span> mais rápida · Rota {shorter} é <span className="font-bold text-amber-600 dark:text-amber-400">{diffKm.toFixed(1)}km</span> mais curta
                </div>
              )
            })()}
          </div>
        )}

        {/* Recommended Stops Timeline */}
        {recommendedStops.length > 0 && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Paradas Recomendadas</h3>
            <div className="space-y-0">
              {/* Origin */}
              <div className="flex items-start gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="pb-2 pt-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{originText || 'Origem'}</p>
                  <p className="text-[10px] text-gray-400">Bateria: {soc}%</p>
                </div>
              </div>

              {/* Stops */}
              {recommendedStops.map((stop, i) => (
                <div key={stop.station.id} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10">
                      {i + 1}
                    </div>
                    {i < recommendedStops.length - 1 && <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />}
                  </div>
                  <div className="pb-2 pt-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{stop.station.name}</p>
                      {stop.station.subscriber_id && (
                        <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">PARCEIRO</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">{stop.station.power_kw}kW • {stop.station.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded font-medium">
                        +{stop.chargingTimeMin}min
                      </span>
                      <span className="text-[10px] text-gray-400">{stop.distanceFromPrev.toFixed(0)}km da última parada</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stop.estimatedArrivalSoc}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-400">{stop.estimatedArrivalSoc}%</span>
                      </div>
                      <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${stop.estimatedDepartureSoc}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-400">{stop.estimatedDepartureSoc}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Destination */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{destText || 'Destino'}</p>
                  <p className="text-[10px] text-gray-400">Distância restante: {(distanceKm - (recommendedStops[recommendedStops.length - 1]?.distanceFromStart || 0)).toFixed(0)}km</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nearby stations when no route */}
        {!route && routeStations.length > 0 && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Eletropostos Disponíveis</h3>
            {routeStations.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
                    {s.subscriber_id && (
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">PARCEIRO</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">{s.power_kw}kW • {s.city}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!route && (
          <div className="p-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Configure seu veículo e a rota</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">O sistema calculará as paradas ideais</p>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Carregando mapa...</p>
            </div>
          </div>
        ) : (
          <MapView stations={routeStations.length > 0 ? routeStations : allStations} center={[-15.7801, -47.9292]} flyToTarget={flyToTarget}
            routeCoordinates={route?.coordinates} altRouteCoordinates={altRoute?.coordinates}
            routeOrigin={originCoords ?? undefined} routeDestination={destCoords ?? undefined}
            recommendedStopIds={recommendedStops.map(s => s.station.id)}
            stopOrderMap={Object.fromEntries(recommendedStops.map((s, i) => [s.station.id, i + 1]))}
            showOnlyRecommendedStops={!!route && recommendedStops.length > 0} />
        )}
      </div>
    </div>
  )
}
