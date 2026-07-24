import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// @ts-expect-error - react-leaflet-markercluster styles
import 'react-leaflet-markercluster/styles'
import type { ChargingStation } from '../../lib/types'
import { Link } from 'react-router-dom'

const stationIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background:#2563eb;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const userIcon = new L.DivIcon({
  className: 'user-marker',
  html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;">
    <svg style="transform:rotate(45deg);width:16px;height:16px" viewBox="0 0 24 24" fill="white">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const originIcon = new L.DivIcon({
  className: 'origin-marker',
  html: `<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">A</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const destIcon = new L.DivIcon({
  className: 'dest-marker',
  html: `<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">B</div>`,
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
  routeOrigin?: [number, number]
  routeDestination?: [number, number]
  flyToTarget?: [number, number] | null
}

const createClusterIcon = (count: number) => new L.DivIcon({
  html: `<div style="background:#2563eb;width:${Math.max(30, 24 + count * 2)}px;height:${Math.max(30, 24 + count * 2)}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${Math.max(10, 9 + count * 0.5)}px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${count}</div>`,
  className: 'cluster-marker',
  iconSize: L.point(30, 30),
})

export function MapView({ stations, onBoundsChange, center = [-15.7801, -47.9292], onStationClick, routeCoordinates, routeOrigin, routeDestination, flyToTarget }: MapViewProps) {
  const stationOnRouteIcon = new L.DivIcon({
    className: 'station-on-route',
    html: `<div style="background:#2563eb;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full rounded-xl" style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <UserLocationMarker />
      <MapFitter center={flyToTarget} zoom={14} />
      {onBoundsChange && <MapEventsHandler onBoundsChange={onBoundsChange} />}

      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline positions={routeCoordinates} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8 }} />
      )}

      {routeOrigin && <Marker position={routeOrigin} icon={originIcon}><Popup>Origem</Popup></Marker>}
      {routeDestination && <Marker position={routeDestination} icon={destIcon}><Popup>Destino</Popup></Marker>}

      <MarkerClusterGroup
        showCoverageOnHover={false}
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        iconCreateFunction={(cluster: { getChildCount: () => number }) => createClusterIcon(cluster.getChildCount())}
      >
        {stations.map((station) => {
          const isOnRoute = routeCoordinates && routeCoordinates.length > 0
          return (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={isOnRoute ? stationOnRouteIcon : stationIcon}
              eventHandlers={{ click: () => onStationClick?.(station) }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-gray-900">{station.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{station.address}</p>
                  <p className="text-sm text-gray-500">{station.city} - {station.state}</p>
                  {station.avg_rating && <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(station.avg_rating))} ({station.review_count})</span>}
                  <div className="mt-2 space-y-0.5">
                    <p className="text-sm font-medium text-blue-600">{station.is_free ? 'GRÁTIS' : `${station.power_kw}kW • R$${station.price_per_kwh}/kWh`}</p>
                    <p className="text-xs text-gray-500">🕐 {station.operating_hours}</p>
                    <p className="text-xs text-gray-500">📅 {station.operating_days}</p>
                  </div>
                  <Link to={`/dashboard/station/${station.id}`} className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">Ver detalhes →</Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}