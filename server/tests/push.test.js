import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'
import { boot, tripInput } from './helpers.js'

const subscription = (n = 1) => ({
  endpoint: `https://push.example.com/send/device-${n}`,
  keys: { p256dh: 'BPx'.padEnd(87, 'a'), auth: 'auth-secret-123' },
})
const withReminders = () => tripInput({ notifications: { remindersEnabled: true, updatesEnabled: true } })

describe('push notifications', () => {
  let ctx
  let pushed
  let pushError

  before(async () => {
    ctx = await boot(
      {},
      {
        pushSendImpl: async (sub, payload) => {
          if (pushError) throw pushError
          pushed.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) })
        },
      },
    )
  })
  after(() => ctx.close())
  beforeEach(() => {
    pushed = []
    pushError = null
  })

  const dueReminder = (tripId) => {
    const job = ctx.db.prepare(`SELECT * FROM jobs WHERE trip_id = ? AND kind = 'reminder' ORDER BY run_at LIMIT 1`).get(tripId)
    ctx.db.prepare('UPDATE jobs SET run_at = 0 WHERE id = ?').run(job.id)
    return job.id
  }
  const jobById = (id) => ctx.db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)

  test('subscribing: exposes the public key, validates input, needs a session, is idempotent', async () => {
    const anon = ctx.client()
    assert.equal((await anon.get('/api/push/key')).body.publicKey, 'test-public-key')
    assert.equal((await anon.post('/api/push/subscriptions', subscription())).status, 401)

    const a = await ctx.client().login()
    assert.equal((await a.post('/api/push/subscriptions', { endpoint: 'http://insecure.example', keys: subscription().keys })).status, 400)
    const ok = await a.post('/api/push/subscriptions', subscription())
    assert.equal(ok.status, 201)
    assert.equal(ok.body.devices, 1)
    assert.equal((await a.post('/api/push/subscriptions', subscription())).body.devices, 1)
  })

  test('a due reminder is sent to every device of the owner and logged; no item titles on the lock screen', async () => {
    const a = await ctx.client().login()
    await a.post('/api/push/subscriptions', subscription(2))
    await a.post('/api/push/subscriptions', subscription(3))
    const { body } = await a.post('/api/trips', withReminders())
    const tripId = body.trip.id
    assert.equal((await a.get(`/api/trips/${tripId}`)).body.notifications.devices, 2)

    const jobId = dueReminder(tripId)
    await ctx.notifications.tick()

    assert.deepEqual(pushed.map((p) => p.endpoint).sort(), [subscription(2).endpoint, subscription(3).endpoint])
    const { payload } = pushed[0]
    assert.match(payload.title, /Your trip to Dubai departs/)
    assert.match(payload.body, /still to check/)
    assert.ok(payload.url.includes(`/trips/${tripId}`))
    assert.ok(!JSON.stringify(payload).includes('Passport'), 'no checklist item titles in the notification')
    assert.equal(jobById(jobId).status, 'sent')
    const [log] = (await a.get(`/api/trips/${tripId}/messages`)).body.messages
    assert.equal(log.provider, 'webpush')
    assert.equal(log.status, 'sent')
  })

  test('no devices → the reminder is skipped, not failed', async () => {
    const a = await ctx.client().login()
    const { body } = await a.post('/api/trips', withReminders())
    const jobId = dueReminder(body.trip.id)
    await ctx.notifications.tick()
    assert.equal(pushed.length, 0)
    assert.equal(jobById(jobId).status, 'skipped')
  })

  test('push service errors retry with backoff; an expired device (410) is forgotten', async () => {
    const a = await ctx.client().login()
    await a.post('/api/push/subscriptions', subscription(4))
    const { body } = await a.post('/api/trips', withReminders())

    pushError = Object.assign(new Error('busy'), { statusCode: 503 })
    const jobId = dueReminder(body.trip.id)
    await ctx.notifications.tick()
    let job = jobById(jobId)
    assert.equal(job.status, 'pending')
    assert.equal(job.attempts, 1)
    assert.ok(job.run_at > Date.now())

    pushError = Object.assign(new Error('gone'), { statusCode: 410 })
    ctx.db.prepare('UPDATE jobs SET run_at = 0 WHERE id = ?').run(jobId)
    await ctx.notifications.tick()
    assert.equal(ctx.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE endpoint = ?').get(subscription(4).endpoint).n, 0)

    // With the device gone, the next attempt finds no devices and stops
    ctx.db.prepare('UPDATE jobs SET run_at = 0 WHERE id = ?').run(jobId)
    await ctx.notifications.tick()
    job = jobById(jobId)
    assert.equal(job.status, 'skipped')
  })

  test('test notification needs a subscribed device', async () => {
    const a = await ctx.client().login()
    assert.equal((await a.post('/api/push/test', {})).status, 502)
    await a.post('/api/push/subscriptions', subscription(5))
    const ok = await a.post('/api/push/test', {})
    assert.equal(ok.status, 200)
    assert.equal(ok.body.sent, 1)
  })

  test('unsubscribing removes only my device', async () => {
    const a = await ctx.client().login()
    await a.post('/api/push/subscriptions', subscription(6))
    const r = await a.request('DELETE', '/api/push/subscriptions', { endpoint: subscription(6).endpoint })
    assert.equal(r.status, 200)
    assert.equal(r.body.devices, 0)
  })
})
