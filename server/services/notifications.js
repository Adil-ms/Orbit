import crypto from 'node:crypto'
import { transaction } from '../db.js'
import { renderNotification } from './messages.js'
import { computeReadiness } from './readiness.js'

const BACKOFF_MS = [60000, 5 * 60000, 15 * 60000, 60 * 60000]

/**
 * Trip notifications (web push) + durable job runner.
 * - Reminders: one job per (trip, offset, departure time) — the UNIQUE dedupe key prevents duplicates.
 * - Updates: at most one pending update job per trip; rapid checks are batched into it.
 * Each message goes to every device where the trip owner turned notifications on.
 */
export function createNotifications({ db, config, push, links, loadTrip, loadItems }) {
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
      if (!p?.reminders_enabled) return
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
    if (!p?.updates_enabled) return null
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

  function finish(job, status, error = null) {
    db.prepare('UPDATE jobs SET status = ?, last_error = ?, locked_at = NULL, updated_at = ? WHERE id = ?').run(status, error, now(), job.id)
  }

  async function processJob(job) {
    const trip = loadTrip(job.trip_id)
    const p = prefsFor(job.trip_id)
    if (!trip || !p) return finish(job, 'skipped', 'Trip removed')
    if (job.kind === 'reminder' && !p.reminders_enabled) return finish(job, 'skipped', 'Reminders turned off')
    if (job.kind === 'update' && !p.updates_enabled) return finish(job, 'skipped', 'Updates turned off')
    if (trip.departureAt <= now()) return finish(job, 'skipped', 'Trip already departed')

    const message = renderNotification(job.kind, { trip, readiness: computeReadiness(loadItems(trip.id)) })
    const r = await push.notifyUser(trip.userId, { ...message, url: links.tripUrl(trip.id), tag: `orbit-${job.kind}-${trip.id}` })
    if (!r.sent && !r.failed) return finish(job, 'skipped', r.error ?? 'No devices have notifications turned on')

    const t = now()
    const devices = r.sent + r.failed
    db.prepare(
      `INSERT INTO message_log (job_id, trip_id, provider, to_masked, kind, body_preview, status, error, created_at, updated_at)
       VALUES (?, ?, 'webpush', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(job.id, trip.id, `${devices} device${devices === 1 ? '' : 's'}`, job.kind, `${message.title}\n${message.body}`, r.sent ? 'sent' : 'failed', r.error, t, t)
    if (r.sent) return finish(job, 'sent')

    // Every device failed: retry with backoff, then give up
    if (job.attempts >= job.max_attempts) return finish(job, 'failed', r.error)
    const delay = BACKOFF_MS[Math.min(job.attempts - 1, BACKOFF_MS.length - 1)]
    db.prepare(`UPDATE jobs SET status = 'pending', run_at = ?, last_error = ?, locked_at = NULL, updated_at = ? WHERE id = ?`).run(now() + delay, r.error, now(), job.id)
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

  return { scheduleReminders, queueUpdate, cancelPending, tick, start, stop, prefsFor }
}
