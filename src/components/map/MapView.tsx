import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// @ts-expect-error - react-leaflet-markercluster styles
import 'react-leaflet-markercluster/styles'
import type { ChargingStation } from '../../lib/types'
import { Link } from 'react-router-dom'

function powerColor(kw: number): string {
  if (kw >= 100) return '#dc2626'
  if (kw >= 50) return '#f59e0b'
  if (kw >= 22) return '#2563eb'
  return '#10b981'
}

const stationIcon = (kw: number) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background:${powerColor(kw)};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);transition:transform 0.2s;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

const userIcon = new L.DivIcon({
  className: 'user-marker',
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:-4px;background:rgba(59,130,246,0.25);border-radius:50%;animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:relative;width:24px;height:24px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="4"/></svg>
    </div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const originIcon = new L.DivIcon({
  className: 'origin-marker',
  html: `<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">A</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const destIcon = new L.DivIcon({
  className: 'dest-marker',
  html: `<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">B</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function UserLocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const map = useMap()

  useEffect(() => {
    map.locate({ setView: false, maxZoom: 14 })
    const onLocationFound = (e: L.LocationEvent) => setPosition(e.latlng)
    map.on('locationfound', onLocationFound)
    return () => { map.off('locationfound', onLocationFound) }
  }, [map])

  if (!position) return null
  return <Marker position={position} icon={userIcon}><Popup>Sua localização</Popup></Marker>
}

function MapFitter({ center, zoom }: { center?: [number, number] | null; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 })
  }, [center, zoom, map])
  return null
}

function MapEventsHandler({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  useMapEvents({ moveend: (e) => onBoundsChange(e.target.getBounds()) })
  return null
}

interface MapViewProps {
  stations: ChargingStation[]
  onBoundsChange?: (bounds: L.LatLngBounds) => void
  center?: [number, number]
  onStationClick?: (station: ChargingStation) => void
  routeCoordinates?: [number, number][]
  altRouteCoordinates?: [number, number][]
  routeOrigin?: [number, number]
  routeDestination?: [number, number]
  flyToTarget?: [number, number] | null
  mapStyle?: 'standard' | 'terrain'
  recommendedStopIds?: string[]
  stopOrderMap?: Record<string, number>
  showOnlyRecommendedStops?: boolean
}

const createClusterIcon = (count: number) => {
  const size = Math.min(60, 28 + Math.log2(count + 1) * 10)
  return new L.DivIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${Math.max(11, 10 + Math.log2(count))}px;border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.5)">${count}</div>`,
    className: 'cluster-marker',
    iconSize: L.point(size, size),
  })
}

export function MapView({ stations, onBoundsChange, center = [-15.7801, -47.9292], onStationClick, routeCoordinates, altRouteCoordinates, routeOrigin, routeDestination, flyToTarget, mapStyle = 'standard', recommendedStopIds = [], stopOrderMap = {}, showOnlyRecommendedStops = false }: MapViewProps) {
  const stationOnRouteIcon = new L.DivIcon({
    className: 'station-on-route',
    html: `<div style="background:#8b5cf6;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(139,92,246,0.4)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [14, 28],
  })

  const makeRecommendedStopIcon = (order: number) => new L.DivIcon({
    className: 'rec-stop',
    html: `<div style="background:linear-gradient(135deg,#f59e0b,#f97316);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 12px rgba(245,158,11,0.6);animation:pulse-gold 2s infinite;position:relative;">
      <span style="color:white;font-weight:900;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${order}</span>
      <div style="position:absolute;top:-4px;right:-4px;background:#2563eb;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid white;">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })

  const tileUrl = mapStyle === 'terrain' 
    ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  const attribution = mapStyle === 'terrain'
    ? '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
    : '&copy; <a href="https://carto.com/">CARTO</a>'

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full rounded-xl" style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution={attribution}
        url={tileUrl}
      />
      <UserLocationMarker />
      <MapFitter center={flyToTarget} zoom={14} />
      {onBoundsChange && <MapEventsHandler onBoundsChange={onBoundsChange} />}


      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline positions={routeCoordinates} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8 }} />
      )}

      {altRouteCoordinates && altRouteCoordinates.length > 0 && (
        <Polyline positions={altRouteCoordinates} pathOptions={{ color: '#f59e0b', weight: 4, opacity: 0.6, dashArray: '10 8' }} />
      )}

      {routeOrigin && <Marker position={routeOrigin} icon={originIcon}><Popup>Origem</Popup></Marker>}
      {routeDestination && <Marker position={routeDestination} icon={destIcon}><Popup>Destino</Popup></Marker>}

      <MarkerClusterGroup
        showCoverageOnHover={false}
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        iconCreateFunction={(cluster: { getChildCount: () => number }) => createClusterIcon(cluster.getChildCount())}
      >
        {(() => {
          const displayStations = showOnlyRecommendedStops && recommendedStopIds.length > 0
            ? stations.filter(s => recommendedStopIds.includes(s.id))
            : stations
          
          return displayStations.map((station) => {
            const order = stopOrderMap[station.id]
            const isRecommended = order !== undefined
            const isOnRoute = routeCoordinates && routeCoordinates.length > 0 && !showOnlyRecommendedStops
            
            return (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
                icon={isRecommended ? makeRecommendedStopIcon(order) : (isOnRoute ? stationOnRouteIcon : stationIcon(station.power_kw))}
                eventHandlers={{ click: () => onStationClick?.(station) }}
              >
              <Popup>
                <div className="min-w-[220px] max-w-[280px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{station.name}</h3>
                        {(station as any).subscriber_id && (
                          <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">PARCEIRO</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{station.city} - {station.state}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: powerColor(station.power_kw) }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="truncate">{station.address || 'Endereço não informado'}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {station.connector_types?.slice(0, 3).map((ct) => (
                      <span key={ct} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{ct}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] mb-2">
                    <span className="font-bold" style={{ color: powerColor(station.power_kw) }}>{station.power_kw}kW</span>
                    <span className="text-gray-300">|</span>
                    {station.is_free ? (
                      <span className="font-bold text-green-600">GRATIS</span>
                    ) : (
                      <span className="text-gray-600">R${station.price_per_kwh}/kWh</span>
                    )}
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">🕐 {station.operating_hours}</span>
                  </div>
                  {station.avg_rating && (
                    <div className="flex items-center gap-1 text-[11px] mb-2">
                      <span className="text-amber-500">{'★'.repeat(Math.round(station.avg_rating))}</span>
                      <span className="text-gray-400">({station.review_count})</span>
                    </div>
                  )}
                  <Link to={`/dashboard/station/${station.id}`}
                    className="block w-full text-center text-[11px] py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Ver detalhes
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
          })
        })()}
      </MarkerClusterGroup>
    </MapContainer>
  )
}