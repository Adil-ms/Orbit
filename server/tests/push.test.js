import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { boot, makeConfig, tripInput } from './helpers.js'

const subscription = (n = 1) => ({
  endpoint: `https://push.example.com/send/device-${n}`,
  keys: { p256dh: 'BPx'.padEnd(87, 'a'), auth: 'auth-secret-123' },
})
const withConsent = () =>
  tripInput({ notifications: { consent: true, whatsapp: '+91 98765 43210', remindersEnabled: true, updatesEnabled: true } })

describe('web push backup', () => {
  let ctx
  let pushed
  let pushFails
  let whatsappFails

  before(async () => {
    const base = makeConfig()
    ctx = await boot(
      {
        whatsapp: { ...base.whatsapp, mode: 'cloud', accessToken: 't', phoneNumberId: '123' },
        push: { publicKey: 'test-public-key', privateKey: 'test-private-key', subject: 'https://orbit.example' },
      },
      {
        fetchImpl: async () =>
          whatsappFails
            ? new Response('{"error":{"message":"(#132001) Template name does not exist in the translation"}}', { status: 404 })
            : new Response(JSON.stringify({ messages: [{ id: 'wamid.ok' }] }), { status: 200 }),
        pushSendImpl: async (sub, payload) => {
          if (pushFails) throw Object.assign(new Error('gone'), { statusCode: 410 })
          pushed.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) })
        },
      },
    )
  })
  after(() => ctx.close())

  test('subscribing: exposes the public key, validates input, needs a session', async () => {
    const anon = ctx.client()
    assert.equal((await anon.get('/api/push/key')).body.publicKey, 'test-public-key')
    assert.equal((await anon.post('/api/push/subscriptions', subscription())).status, 401)

    const a = await ctx.client().login()
    assert.equal((await a.post('/api/push/subscriptions', { endpoint: 'http://insecure.example', keys: subscription().keys })).status, 400)
    const ok = await a.post('/api/push/subscriptions', subscription())
    assert.equal(ok.status, 201)
    assert.equal(ok.body.devices, 1)
    // Re-subscribing the same device is idempotent
    assert.equal((await a.post('/api/push/subscriptions', subscription())).body.devices, 1)
  })

  test('WhatsApp failure → the same reminder goes to the notification bar once, and is logged', async () => {
    pushed = []
    pushFails = false
    whatsappFails = true
    const a = await ctx.client().login()
    await a.post('/api/push/subscriptions', subscription(2))
    const { body } = await a.post('/api/trips', withConsent())
    const tripId = body.trip.id
    const job = ctx.db.prepare(`SELECT * FROM jobs WHERE trip_id = ? AND kind = 'reminder' ORDER BY run_at LIMIT 1`).get(tripId)
    ctx.db.prepare('UPDATE jobs SET run_at = 0 WHERE id = ?').run(job.id)
    await ctx.notifications.tick()

    assert.equal(pushed.length, 1)
    assert.equal(pushed[0].endpoint, subscription(2).endpoint)
    assert.match(pushed[0].payload.title, /Dubai/)
    assert.ok(pushed[0].payload.url.includes(`/trips/${tripId}`))
    assert.ok(!pushed[0].payload.body.includes('Passport'), 'no checklist item titles in the notification')
    const log = ctx.db.prepare(`SELECT * FROM message_log WHERE trip_id = ? ORDER BY id`).all(tripId)
    assert.deepEqual(log.map((m) => [m.provider, m.status]), [['cloud', 'failed'], ['webpush', 'sent']])
    assert.equal((await a.get(`/api/trips/${tripId}/messages`)).body.messages[0].provider, 'webpush')
  })

  test('WhatsApp success → no push is sent', async () => {
    pushed = []
    whatsappFails = false
    const a = await ctx.client().login()
    await a.post('/api/push/subscriptions', subscription(3))
    const { body } = await a.post('/api/trips', withConsent())
    const job = ctx.db.prepare(`SELECT * FROM jobs WHERE trip_id = ? AND kind = 'reminder' ORDER BY run_at LIMIT 1`).get(body.trip.id)
    ctx.db.prepare('UPDATE jobs SET run_at = 0 WHERE id = ?').run(job.id)
    await ctx.notifications.tick()
    assert.equal(pushed.length, 0)
  })

  test('test notification; an expired device (410) is forgotten', async () => {
    pushed = []
    pushFails = false
    const a = await ctx.client().login()
    assert.equal((await a.post('/api/push/test', {})).status, 502, 'no device yet')
    await a.post('/api/push/subscriptions', subscription(4))
    const ok = await a.post('/api/push/test', {})
    assert.equal(ok.status, 200)
    assert.equal(ok.body.sent, 1)

    pushFails = true
    assert.equal((await a.post('/api/push/test', {})).status, 502)
    assert.equal(ctx.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE endpoint = ?').get(subscription(4).endpoint).n, 0)
  })
})
