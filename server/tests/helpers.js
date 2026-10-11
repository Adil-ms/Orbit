import { createApp } from '../app.js'
import { loadConfig } from '../config.js'
import { openDatabase } from '../db.js'

export function makeConfig(overrides = {}) {
  const base = loadConfig()
  return {
    ...base,
    dbPath: ':memory:',
    linkSecret: 'test-secret',
    ai: { ...base.ai, enabled: false },
    push: { publicKey: 'test-public-key', privateKey: 'test-private-key', subject: 'https://orbit.example' },
    schedulerIntervalMs: 999999,
    ...overrides,
  }
}

/** Boots the app on a random port and returns a tiny client with a per-client cookie jar. */
export async function boot(overrides = {}, opts = {}) {
  const config = makeConfig(overrides)
  const db = openDatabase(':memory:')
  // Never reach a real push service from tests; individual tests pass their own fake to inspect sends
  const ctx = createApp(config, { db, pushSendImpl: async () => {}, ...opts })
  const server = await new Promise((resolve) => {
    const s = ctx.app.listen(0, () => resolve(s))
  })
  const base = `http://127.0.0.1:${server.address().port}`

  function client() {
    let cookie = ''
    async function request(method, path, body, headers = {}) {
      const res = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Orbit-Client': '1',
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      })
      const set = res.headers.get('set-cookie')
      if (set) cookie = set.split(';')[0]
      const text = await res.text()
      let json
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = text
      }
      return { status: res.status, body: json }
    }
    return {
      request,
      get: (p, h) => request('GET', p, undefined, h),
      post: (p, b, h) => request('POST', p, b, h),
      patch: (p, b, h) => request('PATCH', p, b, h),
      put: (p, b, h) => request('PUT', p, b, h),
      del: (p, h) => request('DELETE', p, undefined, h),
      async login() {
        await request('POST', '/api/session', {})
        return this
      },
    }
  }

  return { ...ctx, config, base, client, close: () => new Promise((r) => server.close(r)) }
}

/** 'YYYY-MM-DDTHH:MM' in UTC, `hours` from now. */
export function localIn(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString().slice(0, 16)
}

export function tripInput(overrides = {}) {
  return {
    destinationCity: 'Dubai',
    destinationCountry: 'AE',
    purpose: 'tourism',
    departureLocal: localIn(24 * 10),
    departureTz: 'UTC',
    ...overrides,
  }
}
