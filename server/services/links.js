import crypto from 'node:crypto'

/**
 * Signed, expiring, single-trip capability links for WhatsApp messages.
 * The token contains only the trip id and expiry — no personal data.
 */
export function createLinks(config) {
  const sign = (payload) => crypto.createHmac('sha256', config.linkSecret).update(payload).digest('base64url')

  function tokenFor(tripId, now = Date.now()) {
    const exp = now + config.linkTtlHours * 3600000
    const payload = `${tripId}.${exp}`
    return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
  }

  /** Returns the trip id if the token is authentic and unexpired, else null. */
  function verify(token, now = Date.now()) {
    if (typeof token !== 'string' || token.length > 300) return null
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null
    let payload
    try {
      payload = Buffer.from(encoded, 'base64url').toString('utf8')
    } catch {
      return null
    }
    const expected = sign(payload)
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const [tripId, exp] = payload.split('.')
    if (!tripId || !(Number(exp) > now)) return null
    return tripId
  }

  const tripUrl = (tripId) => `${config.appBaseUrl}/trips/${encodeURIComponent(tripId)}?access=${tokenFor(tripId)}`

  return { tokenFor, verify, tripUrl }
}
