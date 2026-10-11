// Geographic helpers. Distances are STRAIGHT-LINE (great-circle) — never present them as road distance or travel time.

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const validCoords = (c) => Array.isArray(c) && c.length === 2 && c.every((n) => Number.isFinite(n))

/** Adds `distanceKm` (or null when either point lacks coordinates) and sorts nearest first. */
export function withDistance(places, origin) {
  return places
    .map((p) => ({ ...p, distanceKm: validCoords(origin) && validCoords(p.coords) ? haversineKm(origin, p.coords) : null }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}

/** Places whose known coordinates fall inside the radius. Places without coordinates are never "nearby". */
export function withinRadius(places, origin, radiusKm) {
  return withDistance(places, origin).filter((p) => p.distanceKm != null && (radiusKm == null || p.distanceKm <= radiusKm))
}

export function formatKm(km) {
  if (km == null) return 'Distance unavailable'
  return km < 1 ? `${Math.round(km * 1000)} m straight-line` : `${km.toFixed(1)} km straight-line`
}
