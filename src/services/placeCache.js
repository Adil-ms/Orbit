// Small localStorage cache for place data fetched from public OpenStreetMap services.
// Keeps repeat visits off the public servers (usage-policy friendly) and lets us look up
// live places later (details page, saved list) without refetching.

const QUERY_KEY = 'orbit-osm-queries'
const PLACE_KEY = 'orbit-osm-places'
const TTL_MS = 24 * 3600 * 1000
const MAX_QUERIES = 15
const MAX_PLACES = 1200

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable — caching is best-effort
  }
}

export function getCachedQuery(key) {
  const entry = read(QUERY_KEY)[key]
  return entry && Date.now() - entry.at < TTL_MS ? entry : null
}

export function setCachedQuery(key, places) {
  const all = read(QUERY_KEY)
  all[key] = { at: Date.now(), ids: places.map((p) => p.id) }
  const keys = Object.keys(all).sort((a, b) => all[b].at - all[a].at)
  write(QUERY_KEY, Object.fromEntries(keys.slice(0, MAX_QUERIES).map((k) => [k, all[k]])))

  const index = read(PLACE_KEY)
  for (const p of places) index[p.id] = { ...p, cachedAt: Date.now() }
  const ids = Object.keys(index).sort((a, b) => index[b].cachedAt - index[a].cachedAt)
  write(PLACE_KEY, Object.fromEntries(ids.slice(0, MAX_PLACES).map((k) => [k, index[k]])))
}

export const getCachedPlace = (id) => read(PLACE_KEY)[id] ?? null
export const getCachedPlaces = (ids) => {
  const index = read(PLACE_KEY)
  return ids.map((id) => index[id]).filter(Boolean)
}
export const allCachedPlaces = () => Object.values(read(PLACE_KEY))
