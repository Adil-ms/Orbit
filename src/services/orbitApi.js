import axios from 'axios'

/**
 * Client for the ORBIT API (server/). Cookie-based guest session; every mutating request carries
 * the X-Orbit-Client header (CSRF defence). Checklist progress is always computed server-side —
 * the client only displays what the server returns.
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 90000, // checklist generation can call an AI model
  withCredentials: true,
  headers: { 'X-Orbit-Client': '1' },
})

let sessionPromise = null
export function ensureSession() {
  sessionPromise ??= http.post('/session', {}).then((r) => r.data.user).catch((e) => {
    sessionPromise = null
    throw e
  })
  return sessionPromise
}

// Signed trip links (opened from a notification) grant access to one trip. Kept for this tab only.
const LINK_KEY = 'orbit-trip-links'
const readLinks = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LINK_KEY) || '{}')
  } catch {
    return {}
  }
}
export function rememberTripLink(tripId, token) {
  sessionStorage.setItem(LINK_KEY, JSON.stringify({ ...readLinks(), [tripId]: token }))
}

http.interceptors.request.use((config) => {
  const m = /^\/trips\/([^/]+)/.exec(config.url || '')
  const token = m && readLinks()[m[1]]
  if (token) config.headers['X-Trip-Access'] = token
  return config
})

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error
    // Session expired or not created yet: create one and retry once
    if (response?.status === 401 && !config.__retried && config.url !== '/session') {
      sessionPromise = null
      await ensureSession()
      return http({ ...config, __retried: true })
    }
    const apiError = new Error(
      response?.data?.error ||
        (error.code === 'ECONNABORTED' ? 'That took too long. Please try again.' : 'We couldn’t reach ORBIT’s server. Is it running?'),
    )
    apiError.status = response?.status
    apiError.fields = response?.data?.details?.fields ?? null
    throw apiError
  },
)

const data = (p) => p.then((r) => r.data)
const withSession = (fn) => async (...args) => {
  await ensureSession()
  return fn(...args)
}

export const api = {
  me: withSession(() => data(http.get('/me'))),
  updateMe: withSession((body) => data(http.patch('/me', body))),
  dashboard: withSession(() => data(http.get('/dashboard'))),
  createTrip: withSession((body) => data(http.post('/trips', body))),
  trip: withSession((id) => data(http.get(`/trips/${id}`))),
  updateTrip: withSession((id, body) => data(http.patch(`/trips/${id}`, body))),
  deleteTrip: withSession((id) => data(http.delete(`/trips/${id}`))),
  addItem: withSession((id, body) => data(http.post(`/trips/${id}/items`, body))),
  updateItem: withSession((id, itemId, body) => data(http.patch(`/trips/${id}/items/${itemId}`, body))),
  deleteItem: withSession((id, itemId) => data(http.delete(`/trips/${id}/items/${itemId}`))),
  reorder: withSession((id, body) => data(http.post(`/trips/${id}/reorder`, body))),
  setNotifications: withSession((id, body) => data(http.put(`/trips/${id}/notifications`, body))),
  messages: withSession((id) => data(http.get(`/trips/${id}/messages`))),
  pushKey: () => data(http.get('/push/key')),
  pushSubscribe: withSession((subscription) => data(http.post('/push/subscriptions', subscription))),
  pushUnsubscribe: withSession((endpoint) => data(http.delete('/push/subscriptions', { data: { endpoint } }))),
  pushTest: withSession(() => data(http.post('/push/test', {}))),
}
