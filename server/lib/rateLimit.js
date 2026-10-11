import { HttpError } from './http.js'

/**
 * Simple in-memory fixed-window rate limiter keyed by user (or IP before a session exists).
 * Suitable for a single server process; swap for a shared store when scaling out.
 */
export function rateLimit({ name, windowMs, max }) {
  const hits = new Map()
  return (req, _res, next) => {
    const key = `${name}:${req.user?.id ?? req.ip}`
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || now - entry.start >= windowMs) {
      hits.set(key, { start: now, count: 1 })
      return next()
    }
    entry.count += 1
    if (entry.count > max) {
      const retry = Math.ceil((entry.start + windowMs - now) / 1000)
      return next(new HttpError(429, `Too many requests — please wait ${retry}s and try again.`))
    }
    next()
  }
}
