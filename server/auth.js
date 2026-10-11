import crypto from 'node:crypto'
import { HttpError, newId } from './lib/http.js'

const COOKIE = 'orbit_sid'
const SESSION_DAYS = 180
const hash = (token) => crypto.createHash('sha256').update(token).digest('hex')

function readCookie(req, name) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

/**
 * Guest-account authentication: a random session token in an httpOnly cookie.
 * Only the SHA-256 hash is stored server-side.
 */
export function createAuth(db, config) {
  const findSession = db.prepare(
    `SELECT s.user_id, s.expires_at, u.display_name, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
  )
  const touch = db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?')

  function setCookie(res, token) {
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.secureCookies,
      maxAge: SESSION_DAYS * 86400000,
      path: '/',
    })
  }

  /** Attaches req.user when a valid session cookie is present. Never creates users. */
  function attachUser(req, _res, next) {
    const token = readCookie(req, COOKIE)
    if (token) {
      const row = findSession.get(hash(token))
      if (row && row.expires_at > Date.now()) {
        req.user = { id: row.user_id, displayName: row.display_name, createdAt: row.created_at }
        touch.run(Date.now(), hash(token))
      }
    }
    next()
  }

  /** POST /api/session — returns the current user, or creates a guest account + session. */
  function ensureSession(req, res) {
    if (req.user) return req.user
    const now = Date.now()
    const user = { id: newId('usr'), displayName: null, createdAt: now }
    const token = crypto.randomBytes(32).toString('base64url')
    db.prepare('INSERT INTO users (id, display_name, created_at) VALUES (?, ?, ?)').run(user.id, null, now)
    db.prepare(
      'INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    ).run(hash(token), user.id, now, now, now + SESSION_DAYS * 86400000)
    setCookie(res, token)
    return user
  }

  function requireUser(req, _res, next) {
    if (!req.user) return next(new HttpError(401, 'Your session has expired. Please reload the page.'))
    next()
  }

  /**
   * CSRF defence for cookie auth: mutating requests must carry a custom header,
   * which cross-site forms cannot set. Combined with SameSite=Lax cookies.
   */
  function requireClientHeader(req, _res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
    if (req.get('X-Orbit-Client') !== '1') return next(new HttpError(403, 'Missing client header.'))
    next()
  }

  return { attachUser, ensureSession, requireUser, requireClientHeader }
}
