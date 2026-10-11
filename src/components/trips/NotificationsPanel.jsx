import { useEffect, useId, useState } from 'react'
import { BellRing, CheckCircle2, Clock, MessageCircle, Send, Smartphone, TriangleAlert } from 'lucide-react'
import Notice from '../ui/Notice'
import { api } from '../../services/orbitApi'
import { disablePush, enablePush, pushStatus } from '../../lib/push'
import { buttonClass, cn } from '../../lib/ui'

const STATUS = {
  mock: { label: 'Recorded', cls: 'bg-cream-200 text-muted', icon: Clock },
  accepted: { label: 'Accepted by WhatsApp', cls: 'bg-sky-50 text-sky-600', icon: Send },
  sent: { label: 'Sent', cls: 'bg-sky-50 text-sky-600', icon: Send },
  delivered: { label: 'Delivered', cls: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  read: { label: 'Read', cls: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  failed: { label: 'Failed', cls: 'bg-red-50 text-danger', icon: TriangleAlert },
}

const PUSH_TEXT = {
  checking: 'Checking this device…',
  unsupported: 'This browser can’t show notifications. On iPhone, add ORBIT to your Home Screen first, then open it from there.',
  blocked: 'Notifications are blocked for this site. Allow them in your browser’s site settings, then reload.',
  off: 'If WhatsApp can’t deliver a reminder, we’ll show it in this device’s notification bar instead.',
  on: 'On for this device. Used only when WhatsApp can’t deliver a message.',
}

/** Web push as a backup channel: lets the owner subscribe this browser/device. */
function PushBackup() {
  const [status, setStatus] = useState('checking')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    pushStatus().then(setStatus, () => setStatus('unsupported'))
  }, [])

  async function run(action, success) {
    setBusy(true)
    setResult(null)
    try {
      await action()
      if (success) setResult({ tone: 'success', text: success })
    } catch (err) {
      setResult({ tone: 'error', text: err.message })
    } finally {
      setStatus(await pushStatus().catch(() => 'off'))
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-cream p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Smartphone className="size-4 text-orange-700" /> Phone notification backup
      </h3>
      <p className="mt-1 text-sm text-muted">{PUSH_TEXT[status]}</p>
      {(status === 'off' || status === 'on') && (
        <div className="mt-3 flex flex-wrap gap-2">
          {status === 'off' ? (
            <button type="button" disabled={busy} onClick={() => run(enablePush, 'Notifications are on for this device.')} className={buttonClass('dark', 'sm')}>
              {busy ? 'Turning on…' : 'Turn on'}
            </button>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => run(api.pushTest, 'Test sent — check your notification bar.')} className={buttonClass('dark', 'sm')}>
                Send a test
              </button>
              <button type="button" disabled={busy} onClick={() => run(disablePush)} className={buttonClass('secondary', 'sm')}>
                Turn off
              </button>
            </>
          )}
        </div>
      )}
      {result && (
        <Notice tone={result.tone} className="mt-3">
          {result.text}
        </Notice>
      )}
    </div>
  )
}

/** WhatsApp preferences + an honest message log for one trip (owner only). */
export default function NotificationsPanel({ tripId, prefs, onSaved, departed }) {
  const phoneId = useId()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ consent: prefs.consent, whatsapp: '', updatesEnabled: prefs.updatesEnabled })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [log, setLog] = useState(null)

  useEffect(() => {
    let alive = true
    api.messages(tripId).then((r) => alive && setLog(r)).catch(() => alive && setLog({ messages: [], scheduled: [] }))
    return () => {
      alive = false
    }
  }, [tripId, prefs])

  async function save(e) {
    e.preventDefault()
    setError(null)
    if (form.consent && !prefs.consent && !form.whatsapp.trim()) return setError('Enter your WhatsApp number with country code.')
    setSaving(true)
    try {
      const typed = form.whatsapp.trim()
      const r = await api.setNotifications(tripId, {
        consent: form.consent,
        whatsapp: typed || null,
        keepNumber: !typed && prefs.consent, // blank field = keep the number we already have
        remindersEnabled: true,
        updatesEnabled: form.updatesEnabled,
      })
      onSaved(r.notifications)
      setEditing(false)
    } catch (err) {
      setError(err.fields ? Object.values(err.fields)[0] : err.message)
    } finally {
      setSaving(false)
    }
  }

  const upcoming = (log?.scheduled ?? []).filter((j) => j.status === 'pending')

  return (
    <section aria-labelledby="wa-title" className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy/5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-success-50 text-success-700">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <h2 id="wa-title" className="text-xl font-medium">
              WhatsApp reminders
            </h2>
            <p className="text-sm text-muted">{prefs.consent ? `On · ${prefs.whatsappMasked}` : 'Off'}</p>
          </div>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className={buttonClass('secondary', 'sm')}>
            {prefs.consent ? 'Change' : 'Turn on'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} noValidate className="mt-5 space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 size-5 shrink-0 cursor-pointer accent-navy" />
            <span className="text-[15px]">{prefs.consentText}</span>
          </label>
          {form.consent && (
            <>
              <div>
                <label htmlFor={phoneId} className="text-sm font-bold">
                  WhatsApp number {prefs.consent && <span className="font-semibold text-muted">(leave blank to keep {prefs.whatsappMasked})</span>}
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 h-12 w-full rounded-xl px-4 ring-1 ring-navy/15 focus:ring-2 focus:ring-sky focus:outline-none"
                />
              </div>
              <p className="rounded-xl bg-success-50 p-3 text-sm text-navy">Reminders are always on: 24 hours and 3 hours before departure.</p>
              <fieldset className="space-y-1">
                <legend className="text-sm font-bold">Also send me</legend>
                {[
                  ['updatesEnabled', 'Batched updates when I check items'],
                ].map(([k, t]) => (
                  <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="size-5 cursor-pointer accent-navy" />
                    {t}
                  </label>
                ))}
              </fieldset>
            </>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={buttonClass('dark', 'md')}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={buttonClass('secondary', 'md')}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        prefs.consent && (
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <BellRing className="size-4 text-orange-700" /> Scheduled
              </h3>
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
            <PushBackup />
          </div>
        )
      )}

      {log?.messages?.length > 0 && (
        <div className="mt-5 border-t border-navy/8 pt-4">
          <h3 className="text-sm font-bold">Recent messages</h3>
          <ul className="mt-2 space-y-2">
            {log.messages.slice(0, 5).map((m) => {
              const s = STATUS[m.status] ?? STATUS.mock
              return (
                <li key={m.id} className="rounded-xl bg-cream p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {m.kind === 'reminder' ? 'Reminder' : 'Checklist update'}{' '}
                      <span className="font-semibold text-muted">· {m.provider === 'webpush' ? 'Push backup' : 'WhatsApp'}</span>
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', s.cls)}>
                      <s.icon className="size-3.5" /> {s.label}
                    </span>
                  </div>
                  <details className="mt-1">
                    <summary className="min-h-9 cursor-pointer text-sm font-semibold text-sky-600">Preview message</summary>
                    <pre className="mt-2 font-sans text-sm whitespace-pre-wrap text-navy">{m.body_preview}</pre>
                  </details>
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
