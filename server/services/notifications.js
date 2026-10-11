import crypto from 'node:crypto'
import { transaction } from '../db.js'
import { maskPhone } from '../lib/http.js'
import { computeReadiness } from './readiness.js'
import { renderMessage } from './whatsapp.js'

const BACKOFF_MS = [60000, 5 * 60000, 15 * 60000, 60 * 60000]

/**
 * Notification scheduling + durable job runner.
 * - Reminders: one job per (trip, offset, departure time) — the UNIQUE dedupe key prevents duplicates.
 * - Updates: at most one pending update job per trip; rapid checks are batched into it.
 */
export function createNotifications({ db, config, whatsapp, push, links, loadTrip, loadItems }) {
  const now = () => Date.now()

  function prefsFor(tripId) {
    return db.prepare('SELECT * FROM notification_prefs WHERE trip_id = ?').get(tripId) ?? null
  }

  function cancelPending(tripId, kind) {
    db.prepare(
      `UPDATE jobs SET status = 'cancelled', updated_at = ? WHERE trip_id = ? AND status = 'pending' ${kind ? 'AND kind = ?' : ''}`,
    ).run(...(kind ? [now(), tripId, kind] : [now(), tripId]))
  }

  /** (Re)builds reminder jobs for a trip from its current departure time and preferences. */
  function scheduleReminders(trip) {
    transaction(db, () => {
      cancelPending(trip.id, 'reminder')
      const p = prefsFor(trip.id)
      if (!p || !p.consent || !p.reminders_enabled || !p.whatsapp_e164) return
      const offsets = p.offsets_hours.split(',').map(Number).filter((n) => n > 0)
      for (const h of offsets) {
        const runAt = trip.departureAt - h * 3600000
        if (runAt <= now()) continue // never send a reminder for a moment that has passed
        const key = `reminder:${trip.id}:${h}:${trip.departureAt}`
        // Re-activate a previously cancelled identical job instead of inserting a duplicate
        db.prepare(
          `INSERT INTO jobs (trip_id, user_id, kind, dedupe_key, run_at, status, max_attempts, created_at, updated_at)
           VALUES (?, ?, 'reminder', ?, ?, 'pending', ?, ?, ?)
           ON CONFLICT(dedupe_key) DO UPDATE SET status = 'pending', attempts = 0, last_error = NULL, run_at = excluded.run_at, updated_at = excluded.updated_at
           WHERE jobs.status = 'cancelled'`,
        ).run(trip.id, trip.userId, key, runAt, config.reminders.maxAttempts, now(), now())
      }
    })
  }

  /** Called after a checklist change. Batches rapid changes into a single pending update. */
  function queueUpdate(trip) {
    const p = prefsFor(trip.id)
    if (!p || !p.consent || !p.updates_enabled || !p.whatsapp_e164) return null
    const pending = db.prepare(`SELECT id FROM jobs WHERE trip_id = ? AND kind = 'update' AND status = 'pending'`).get(trip.id)
    if (pending) return pending.id // already batched — it renders the latest state when it runs
    const t = now()
    const r = db
      .prepare(
        `INSERT INTO jobs (trip_id, user_id, kind, dedupe_key, run_at, status, max_attempts, payload, created_at, updated_at)
         VALUES (?, ?, 'update', ?, ?, 'pending', ?, ?, ?, ?)`,
      )
      .run(trip.id, trip.userId, `update:${trip.id}:${crypto.randomUUID()}`, t + config.reminders.updateBatchSeconds * 1000, config.reminders.maxAttempts, JSON.stringify({ since: t }), t, t)
    return Number(r.lastInsertRowid)
  }

  /** Claims due jobs atomically so overlapping ticks never process the same job twice. */
  function claimDue(limit = 10) {
    return transaction(db, () => {
      const t = now()
      // Recover jobs stuck in "running" after a crash
      db.prepare(`UPDATE jobs SET status = 'pending', locked_at = NULL WHERE status = 'running' AND locked_at < ?`).run(t - 5 * 60000)
      return db
        .prepare(
          `UPDATE jobs SET status = 'running', locked_at = ?, attempts = attempts + 1, updated_at = ?
            WHERE id IN (SELECT id FROM jobs WHERE status = 'pending' AND run_at <= ? ORDER BY run_at LIMIT ?)
            RETURNING *`,
        )
        .all(t, t, t, limit)
    })
  }

  /** Backup channel: shows the message in the notification bar of the owner's subscribed devices. */
  async function sendPushBackup(job, trip, rendered, link) {
    if (!push?.enabled) return
    const r = await push.notifyUser(trip.userId, { ...rendered.push, url: link, tag: `orbit-${job.kind}-${trip.id}` })
    if (!r.sent && !r.failed) return // no devices subscribed
    const t = now()
    db.prepare(
      `INSERT INTO message_log (job_id, trip_id, provider, to_masked, kind, body_preview, status, error, created_at, updated_at)
       VALUES (?, ?, 'webpush', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(job.id, trip.id, `${r.sent + r.failed} device${r.sent + r.failed === 1 ? '' : 's'}`, job.kind, `${rendered.push.title}\n${rendered.push.body}`, r.sent ? 'sent' : 'failed', r.error, t, t)
  }

  function finish(job, status, error = null) {
    db.prepare('UPDATE jobs SET status = ?, last_error = ?, locked_at = NULL, updated_at = ? WHERE id = ?').run(status, error, now(), job.id)
  }

  async function processJob(job) {
    const trip = loadTrip(job.trip_id)
    const p = prefsFor(job.trip_id)
    if (!trip || !p || !p.consent || !p.whatsapp_e164) return finish(job, 'skipped', 'No consent or trip removed')
    if (job.kind === 'reminder' && !p.reminders_enabled) return finish(job, 'skipped', 'Reminders disabled')
    if (job.kind === 'update' && !p.updates_enabled) return finish(job, 'skipped', 'Updates disabled')
    if (trip.departureAt <= now()) return finish(job, 'skipped', 'Trip already departed')

    const items = loadItems(trip.id)
    const readiness = computeReadiness(items)
    const link = links.tripUrl(trip.id)
    const rendered = renderMessage(job.kind, { trip, items, readiness, link })
    const t = now()

    try {
      const result = await whatsapp.send({ to: p.whatsapp_e164, kind: job.kind, rendered })
      db.prepare(
        `INSERT INTO message_log (job_id, trip_id, provider, provider_message_id, to_masked, kind, body_preview, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(job.id, trip.id, result.provider, result.providerMessageId, maskPhone(p.whatsapp_e164), job.kind, rendered.text, result.status, t, t)
      finish(job, 'sent')
    } catch (err) {
      db.prepare(
        `INSERT INTO message_log (job_id, trip_id, provider, to_masked, kind, body_preview, status, error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'failed', ?, ?, ?)`,
      ).run(job.id, trip.id, whatsapp.mode, maskPhone(p.whatsapp_e164), job.kind, rendered.text, String(err.message).slice(0, 300), t, t)
      // WhatsApp didn't take it: send the push backup once (on the first failure, so time-sensitive reminders aren't delayed by retries)
      if (job.attempts === 1) await sendPushBackup(job, trip, rendered, link)
      if (err.permanent || job.attempts >= job.max_attempts) return finish(job, 'failed', String(err.message).slice(0, 300))
      const delay = BACKOFF_MS[Math.min(job.attempts - 1, BACKOFF_MS.length - 1)]
      db.prepare(`UPDATE jobs SET status = 'pending', run_at = ?, last_error = ?, locked_at = NULL, updated_at = ? WHERE id = ?`).run(
        now() + delay,
        String(err.message).slice(0, 300),
        now(),
        job.id,
      )
    }
  }

  async function tick() {
    const jobs = claimDue()
    for (const job of jobs) await processJob(job)
    return jobs.length
  }

  let timer = null
  function start() {
    if (timer) return
    timer = setInterval(() => tick().catch((e) => console.error('[scheduler]', e)), config.schedulerIntervalMs)
    timer.unref?.()
  }
  const stop = () => clearInterval(timer)

  /** Applies provider status webhooks. Only these can move a message to delivered/read. */
  function applyStatus({ id, status, errorTitle }) {
    const rank = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 4 }
    if (!id || !(status in rank) || status === 'accepted') return 0
    const row = db.prepare('SELECT id, status FROM message_log WHERE provider_message_id = ?').get(id)
    // Webhooks can arrive out of order — never move a message backwards (e.g. delivered → sent)
    if (!row || (rank[row.status] ?? -1) >= rank[status]) return 0
    return db
      .prepare('UPDATE message_log SET status = ?, error = COALESCE(?, error), updated_at = ? WHERE id = ?')
      .run(status, errorTitle ?? null, now(), row.id).changes
  }

  return { scheduleReminders, queueUpdate, cancelPending, tick, start, stop, applyStatus, prefsFor }
}
