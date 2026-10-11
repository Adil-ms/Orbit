import webpush from 'web-push'

/**
 * Web Push (VAPID) — a backup channel that shows trip reminders in the phone's notification bar
 * when WhatsApp can't deliver. Subscriptions belong to a user (all their browsers/devices).
 * `sendImpl` is injectable so tests never call a real push service.
 */
export function createPush({ db, config, sendImpl = webpush.sendNotification }) {
  const p = config.push
  const enabled = Boolean(p.publicKey && p.privateKey && p.subject)
  const vapidDetails = enabled ? { subject: p.subject, publicKey: p.publicKey, privateKey: p.privateKey } : null

  function subscribe(userId, { endpoint, keys }) {
    const t = Date.now()
    db.prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, updated_at = excluded.updated_at`,
    ).run(userId, endpoint, keys.p256dh, keys.auth, t, t)
  }

  const unsubscribe = (userId, endpoint) => db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(userId, endpoint).changes
  const count = (userId) => db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?').get(userId).n

  /** Sends one notification to every device of the user. Never throws; returns { sent, failed, error }. */
  async function notifyUser(userId, { title, body, url, tag }) {
    if (!enabled) return { sent: 0, failed: 0, error: 'Push notifications are not configured on the server.' }
    const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId)
    const payload = JSON.stringify({ title, body, url, tag })
    let sent = 0
    let failed = 0
    let error = null
    for (const s of subs) {
      try {
        await sendImpl({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { vapidDetails, TTL: 6 * 3600, urgency: 'high' })
        sent += 1
      } catch (err) {
        failed += 1
        // 404/410: the browser dropped this subscription — forget it
        if (err.statusCode === 404 || err.statusCode === 410) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id)
        error = String(err.body || err.message).slice(0, 300)
      }
    }
    return { sent, failed, error }
  }

  return { enabled, publicKey: enabled ? p.publicKey : null, subscribe, unsubscribe, count, notifyUser }
}
