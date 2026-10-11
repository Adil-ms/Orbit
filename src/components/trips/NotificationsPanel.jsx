import { useEffect, useState } from 'react'
import { BellRing, CheckCircle2, TriangleAlert } from 'lucide-react'
import Notice from '../ui/Notice'
import PushDeviceControl from './PushDeviceControl'
import { api } from '../../services/orbitApi'
import { cn } from '../../lib/ui'

const STATUS = {
  sent: { label: 'Sent', cls: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  failed: { label: 'Failed', cls: 'bg-red-50 text-danger', icon: TriangleAlert },
}

/** Reminder preferences for one trip (owner only): push notifications, schedule and an honest send log. */
export default function NotificationsPanel({ tripId, prefs, onSaved, departed }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [log, setLog] = useState(null)

  useEffect(() => {
    let alive = true
    api.messages(tripId).then((r) => alive && setLog(r)).catch(() => alive && setLog({ messages: [], scheduled: [] }))
    return () => {
      alive = false
    }
  }, [tripId, prefs])

  // Saves the trip's choices; also used to refresh the device count after this device changes
  async function save(patch = {}) {
    setSaving(true)
    setError(null)
    try {
      const r = await api.setNotifications(tripId, { remindersEnabled: prefs.remindersEnabled, updatesEnabled: prefs.updatesEnabled, ...patch })
      onSaved(r.notifications)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const anyOn = prefs.remindersEnabled || prefs.updatesEnabled
  const upcoming = (log?.scheduled ?? []).filter((j) => j.status === 'pending')
  const offsets = prefs.offsetsHours.map((h) => `${h} hours`).join(' and ')

  return (
    <section aria-labelledby="rem-title" className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy/5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-orange-700">
          <BellRing className="size-5" />
        </span>
        <div>
          <h2 id="rem-title" className="text-xl font-medium">
            Reminders
          </h2>
          <p className="text-sm text-muted">
            {anyOn ? `On · ${prefs.devices} device${prefs.devices === 1 ? '' : 's'} will be notified` : 'Off'}
          </p>
        </div>
      </div>

      <fieldset className="mt-4 space-y-1" disabled={saving}>
        <legend className="sr-only">Notifications for this trip</legend>
        {[
          ['remindersEnabled', `Remind me ${offsets} before departure`],
          ['updatesEnabled', 'A short update when I check items (batched)'],
        ].map(([key, text]) => (
          <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" checked={prefs[key]} onChange={(e) => save({ [key]: e.target.checked })} className="size-5 shrink-0 cursor-pointer accent-navy" />
            {text}
          </label>
        ))}
      </fieldset>
      {error && <Notice tone="error">{error}</Notice>}

      {anyOn && (
        <div className="mt-4 space-y-4">
          {!prefs.pushAvailable ? (
            <Notice tone="warning">Notifications aren’t set up on ORBIT’s server yet, so reminders can’t be sent.</Notice>
          ) : (
            prefs.devices === 0 && <Notice tone="warning">No device has notifications turned on yet, so reminders can’t reach you. Turn them on below.</Notice>
          )}
          <PushDeviceControl onChange={() => save()} />
          <div>
            <h3 className="text-sm font-bold">Scheduled</h3>
            {upcoming.length ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {upcoming.map((j) => (
                  <li key={j.id} className="flex justify-between gap-3 rounded-xl bg-cream px-3 py-2">
                    <span className="font-semibold">{j.kind === 'reminder' ? 'Reminder' : 'Checklist update'}</span>
                    <span className="text-muted tabular-nums">{new Date(j.run_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">{departed ? 'This trip has departed.' : 'Nothing scheduled right now.'}</p>
            )}
          </div>
        </div>
      )}

      {log?.messages?.length > 0 && (
        <div className="mt-5 border-t border-navy/8 pt-4">
          <h3 className="text-sm font-bold">Recent notifications</h3>
          <ul className="mt-2 space-y-2">
            {log.messages.slice(0, 5).map((m) => {
              const s = STATUS[m.status] ?? STATUS.failed
              const [title, body] = m.body_preview.split('\n')
              return (
                <li key={m.id} className="rounded-xl bg-cream p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {m.kind === 'reminder' ? 'Reminder' : 'Checklist update'} <span className="font-semibold text-muted">· {m.to_masked}</span>
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', s.cls)}>
                      <s.icon className="size-3.5" /> {s.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-navy">{title}</p>
                  {body && <p className="text-sm text-muted">{body}</p>}
                  {m.error && <p className="mt-1 text-xs text-danger">{m.error}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
