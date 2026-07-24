import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { MapView } from '../../components/map/MapView'
import type { ChargingStation } from '../../lib/types'
import { geocode, getRoute, getStationsNearRoute, formatDuration, formatDistance, haversineDistance, type NominatimResult, type RouteResult } from '../../lib/route'

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

export function TripPlanner() {
  const [allStations, setAllStations] = useState<ChargingStation[]>([])
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCar, setSelectedCar] = useState(EV_CARS[0])
  const [soc, setSoc] = useState(80)
  const [minSoc, setMinSoc] = useState(20)
  const [customAutonomy, setCustomAutonomy] = useState(400)

  const [originText, setOriginText] = useState('')
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null)
  const [originResults, setOriginResults] = useState<NominatimResult[]>([])
  const [destText, setDestText] = useState('')
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null)
  const [destResults, setDestResults] = useState<NominatimResult[]>([])
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeStations, setRouteStations] = useState<ChargingStation[]>([])
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null)

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

  useEffect(() => { fetchStations() }, [])

  const fetchStations = async () => {
    const { data } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
    if (data) {
      setAllStations(data as ChargingStation[])
      setStations(data as ChargingStation[])
    }
    setLoading(false)
  }

  const autonomy = selectedCar.name === 'Outro'
    ? customAutonomy
    : (selectedCar.autonomy * soc) / 100
  const usableRange = autonomy
  const needChargeAt = (autonomy * minSoc) / 100
  const maxChargeRange = autonomy - needChargeAt

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
    setOriginCoords([parseFloat(r.lat), parseFloat(r.lon)])
    setFocusOrigin(false)
    setFlyToTarget([parseFloat(r.lat), parseFloat(r.lon)])
  }

  const selectDest = (r: NominatimResult) => {
    setDestText(r.display_name.length > 40 ? r.display_name.substring(0, 40) + '...' : r.display_name)
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
    try {
      const r = await getRoute({ lat: originCoords[0], lng: originCoords[1] }, { lat: destCoords[0], lng: destCoords[1] })
      setRoute(r)

      const nearby = getStationsNearRoute(allStations, r.coordinates, 20)
      setRouteStations(nearby)
      setStations(nearby.length > 0 ? nearby : allStations)
    } catch {}
    setRouteLoading(false)
  }

  const distanceKm = route ? route.distance / 1000 : 0
  const autonomyKm = usableRange
  const needsCharging = distanceKm > autonomyKm * 0.9
  const chargeStopsNeeded = needsCharging ? Math.ceil(distanceKm / maxChargeRange) : 0

  const getChargingStrategy = () => {
    if (!route) return null
    if (!needsCharging) {
      return { type: 'direct', message: `Trajeto direto! Você tem autonomia suficiente (${autonomyKm.toFixed(0)}km) para percorrer ${distanceKm.toFixed(0)}km.` }
    }
    return {
      type: 'stops',
      message: `Sua autonomia atual é de ${autonomyKm.toFixed(0)}km. Para ${(distanceKm).toFixed(0)}km, você precisará parar em pelo menos ${chargeStopsNeeded} eletroposto(s) ao longo da rota.`,
      stops: routeStations.slice(0, chargeStopsNeeded),
    }
  }

  const strategy = getChargingStrategy()

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-96 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto flex-shrink-0 hidden md:block">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
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

        {/* Car Selection */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seu Veículo</h3>
          <select value={selectedCar.name} onChange={(e) => {
            const car = EV_CARS.find(c => c.name === e.target.value)
            if (car) setSelectedCar(car)
          }} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            {EV_CARS.map(car => <option key={car.name} value={car.name}>{car.name}</option>)}
          </select>

          {selectedCar.name === 'Outro' && (
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase">Autonomia (km)</label>
              <input type="number" value={customAutonomy} onChange={(e) => setCustomAutonomy(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}

          {/* SOC Slider */}
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

          {/* Min SOC */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-medium text-gray-400 uppercase">SOC Mínimo</label>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{minSoc}%</span>
            </div>
            <input type="range" min={5} max={50} value={minSoc} onChange={(e) => setMinSoc(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>

          {/* Autonomy Display */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-3.5 border border-blue-100 dark:border-blue-800/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{autonomyKm.toFixed(0)}</div>
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
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rota</h3>
          <div ref={originRef} className="relative">
            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Origem</label>
            <div className="flex gap-1.5">
              <input type="text" placeholder="Digite ou use GPS..."
                value={originText} onChange={(e) => handleOriginInput(e.target.value)}
                onFocus={() => originResults.length > 0 && setFocusOrigin(true)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="button" onClick={useGps} title="GPS"
                className="px-2.5 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
              </button>
            </div>
            {focusOrigin && originResults.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {originResults.map((r, i) => (
                  <button key={i} type="button" className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            {focusDest && destResults.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {destResults.map((r, i) => (
                  <button key={i} type="button" className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onMouseDown={(e) => { e.preventDefault(); selectDest(r) }}>
                    <div className="font-medium">{r.display_name.split(',')[0]}</div>
                    <div className="text-gray-400 text-[10px] mt-0.5 truncate">{r.display_name.split(',').slice(1, 4).join(',')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={calculateRoute} disabled={!originCoords || !destCoords || routeLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]">
            {routeLoading ? 'Calculando...' : 'Planejar Viagem'}
          </button>
        </div>

        {/* Strategy Result */}
        {strategy && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className={`rounded-xl p-3.5 text-xs ${strategy.type === 'direct' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300'}`}>
              <p className="font-medium mb-1">{strategy.type === 'direct' ? 'Trajeto Direto' : 'Atenção: Paradas Necessárias'}</p>
              <p>{strategy.message}</p>
            </div>
            {route && (
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Distância total</span><span className="font-semibold text-gray-900 dark:text-white">{formatDistance(route.distance)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tempo estimado</span><span className="font-semibold text-gray-900 dark:text-white">{formatDuration(route.duration)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Eletropostos na rota</span><span className="font-semibold text-blue-600 dark:text-blue-400">{routeStations.length}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Recommended Stops */}
        {strategy?.type === 'stops' && routeStations.length > 0 && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Eletropostos Recomendados</h3>
            {routeStations.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.power_kw}kW • {s.city}</p>
                </div>
                <span className="text-[10px] text-gray-400">
                  {originCoords ? `${haversineDistance({ lat: originCoords[0], lng: originCoords[1] }, { lat: s.latitude, lng: s.longitude }).toFixed(0)}km` : ''}
                </span>
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
          <MapView stations={stations} center={[-15.7801, -47.9292]} flyToTarget={flyToTarget}
            routeCoordinates={route?.coordinates} routeOrigin={originCoords ?? undefined} routeDestination={destCoords ?? undefined} />
        )}
      </div>
    </div>
  )
}
