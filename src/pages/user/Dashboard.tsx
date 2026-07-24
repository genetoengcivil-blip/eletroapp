import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { ChargingStation } from '../../lib/types'
import { MapView } from '../../components/map/MapView'
import { haversineDistance } from '../../lib/route'

export function UserDashboard() {
  useAuthStore()
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [allStations, setAllStations] = useState<ChargingStation[]>([])
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterPower, setFilterPower] = useState<number>(0)
  const [filterFreeOnly, setFilterFreeOnly] = useState(false)
  const [filterConnector, setFilterConnector] = useState('')
  const [filterState, setFilterState] = useState('')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchParams] = useSearchParams()

  const searchRef = useRef<HTMLDivElement>(null)

  const powerColor = (kw: number): string => {
    if (kw >= 100) return '#dc2626'
    if (kw >= 50) return '#f59e0b'
    if (kw >= 22) return '#2563eb'
    return '#10b981'
  }

  useEffect(() => { fetchStations() }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(loc)
      },
      () => {}
    )
  }, [])

  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (lat && lng) {
      setFlyToTarget([parseFloat(lat), parseFloat(lng)])
    }
  }, [searchParams])

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

  const filteredStations = stations.filter(
    (s) =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.city.toLowerCase().includes(searchQuery.toLowerCase())) &&
      s.power_kw >= filterPower &&
      (!filterFreeOnly || s.is_free) &&
      (!filterConnector || s.connector_types?.includes(filterConnector)) &&
      (!filterState || s.state === filterState)
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

  const activeFilters = (filterPower > 0 || filterFreeOnly || filterConnector || filterState)

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-96 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white">Eletropostos</h1>
                <p className="text-[11px] text-gray-400">{allStations.length} estações em todo o Brasil</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Link to="/dashboard/trip-planner"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Planejar Viagem
              </Link>
            </div>
          </div>
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar por nome ou cidade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-gray-50 dark:bg-gray-800 dark:text-white placeholder-gray-400 transition-all" />
          </div>
        </div>

        {/* Filters toggle */}
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <svg className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Filtros
            {activeFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{filteredStations.length} resultado{filteredStations.length !== 1 ? 's' : ''}</span>
            {activeFilters && (
              <button onClick={() => { setFilterPower(0); setFilterFreeOnly(false); setFilterConnector(''); setFilterState('') }}
                className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Limpar</button>
            )}
          </div>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 space-y-2.5 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Estado</label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
                  <option value="">Todos</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-2">
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
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">&nbsp;</label>
                <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <input type="checkbox" checked={filterFreeOnly} onChange={(e) => setFilterFreeOnly(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Apenas gratuitos</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Station List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 font-medium">Nenhum eletroposto encontrado</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            filteredStations.map((station) => (
              <div key={station.id}
                className={`group p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedStation?.id === station.id
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 shadow-md'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }`}
                onClick={() => { setSelectedStation(station); setFlyToTarget([station.latitude, station.longitude]) }}>
                
                <div className="flex gap-3">
                  {station.image_url ? (
                    <img src={station.image_url} alt={station.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${powerColor(station.power_kw)}12` }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: powerColor(station.power_kw) }}>
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{station.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                        isStationOpen(station.operating_hours)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isStationOpen(station.operating_hours) ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{station.address || station.city}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: `${powerColor(station.power_kw)}12` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: powerColor(station.power_kw) }} />
                        <span className="text-[10px] font-bold" style={{ color: powerColor(station.power_kw) }}>{station.power_kw}kW</span>
                      </div>
                      {station.is_free ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md font-bold">GRATIS</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">R${station.price_per_kwh}/kWh</span>
                      )}
                      {userLocation && (
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium ml-auto">{getStationDistance(station)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {station.connector_types?.slice(0, 3).map((ct) => (
                        <span key={ct} className="text-[9px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-medium">{ct}</span>
                      ))}
                      {station.avg_rating && (
                        <span className="text-[10px] text-amber-500 ml-auto flex items-center gap-0.5">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          {station.avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5 mt-2.5">
                  <Link to={`/dashboard/trip-planner?dest=${station.latitude},${station.longitude}&name=${encodeURIComponent(station.name)}&city=${encodeURIComponent(station.city)}`}
                    className="text-[10px] py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium flex-1 flex items-center justify-center gap-1 active:scale-95"
                    onClick={(e) => e.stopPropagation()}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Rota
                  </Link>
                  <a href={`https://www.waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`}
                    target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="text-[10px] py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-center font-medium flex-1 flex items-center justify-center gap-1 active:scale-95">
                    Waze
                  </a>
                  <button type="button" onClick={(e) => { e.stopPropagation(); shareStation(station) }}
                    className="text-[10px] py-1.5 px-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                    title="Compartilhar">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <Link to={`/dashboard/station/${station.id}`} className="text-[10px] py-1.5 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center font-medium flex-1 active:scale-95"
                    onClick={(e) => e.stopPropagation()}>Detalhes</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView stations={filteredStations} onStationClick={(s) => { setSelectedStation(s); setFlyToTarget([s.latitude, s.longitude]) }}
          flyToTarget={flyToTarget} />
        
        {/* Stats overlay */}
        <div className="absolute top-4 left-4 z-[1000] hidden sm:block">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-2.5">
            <div className="flex items-center gap-4 text-sm">
              <div><span className="text-gray-400">Total:</span><span className="ml-1 font-bold text-gray-900 dark:text-white">{allStations.length}</span></div>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <div><span className="text-gray-400">Mostrando:</span><span className="ml-1 font-bold text-gray-900 dark:text-white">{filteredStations.length}</span></div>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg p-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Buscar eletropostos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
