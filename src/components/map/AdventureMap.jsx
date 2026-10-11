import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router'

// Custom div-icons avoid Leaflet's default image markers (which break under bundlers)
const startIcon = L.divIcon({
  className: 'orbit-pin',
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:#141414;border:4px solid #fff;box-shadow:0 0 0 6px rgba(201,68,31,.25),0 4px 10px rgba(11,29,51,.35)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function activityIcon(label, highlight = false) {
  const bg = highlight ? '#C9441F' : '#141414'
  const fg = highlight ? '#141414' : '#fff'
  return L.divIcon({
    className: 'orbit-pin',
    html: `<div style="transform:translate(-50%,-100%);position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center">
      <div style="min-width:28px;height:28px;padding:0 8px;border-radius:9999px;background:${bg};color:${fg};font:700 12px/28px 'Plus Jakarta Sans',sans-serif;text-align:center;border:2.5px solid #fff;box-shadow:0 6px 14px rgba(11,29,51,.3)">${label}</div>
      <div style="width:3px;height:8px;background:${bg};border-radius:2px;margin-top:-1px"></div></div>`,
    iconSize: [0, 0],
  })
}

function FitBounds({ points, radiusKm }) {
  const map = useMap()
  // Only refit when the set of points actually changes, not on every re-render
  const key = JSON.stringify(points)
  useEffect(() => {
    const pts = JSON.parse(key)
    if (pts.length === 1 && radiusKm) map.fitBounds(L.latLng(pts[0]).toBounds(radiusKm * 2200), { padding: [20, 20] })
    else if (pts.length === 1) map.setView(pts[0], 15)
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 })
  }, [map, key, radiusKm])
  return null
}

/**
 * start:   { coords, label }
 * places:  [{ id, name, coords, label }]
 * (No line is drawn between points: we have no routing data, and a straight line would look like a route.)
 * radiusKm: draw an approximate exploration radius around start
 */
export default function AdventureMap({ start, places = [], radiusKm, highlightId, className = 'h-80' }) {
  const located = places.filter((p) => p.coords)
  const points = [...(start?.coords ? [start.coords] : []), ...located.map((p) => p.coords)]
  if (!points.length) return null

  return (
    <div className={`overflow-hidden rounded-3xl ring-1 ring-navy/10 ${className}`}>
      <MapContainer center={points[0]} zoom={14} scrollWheelZoom={false} className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} radiusKm={radiusKm} />
        {start?.coords && (
          <Marker position={start.coords} icon={startIcon} title={`Start: ${start.label}`} alt={`Start: ${start.label}`}>
            <Popup>
              <strong>Start:</strong> {start.label}
            </Popup>
          </Marker>
        )}
        {radiusKm && start?.coords && (
          <Circle
            center={start.coords}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#141414', weight: 1.5, fillColor: '#141414', fillOpacity: 0.08, dashArray: '6 6' }}
          />
        )}
        {located.map((p, i) => (
          <Marker key={p.id} position={p.coords} icon={activityIcon(p.label ?? i + 1, p.id === highlightId || located.length === 1)}
            title={p.name}
            alt={p.name}
          >
            <Popup>
              <Link to={`/adventure/${p.id}`} className="font-semibold">
                {p.name}
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
