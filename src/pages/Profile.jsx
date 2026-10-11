import { useEffect, useId, useState } from 'react'
import { LoaderCircle, ShieldCheck, UserRound } from 'lucide-react'
import Mascot from '../components/mascot/Mascot'
import Notice from '../components/ui/Notice'
import { api } from '../services/orbitApi'
import { buttonClass } from '../lib/ui'

export default function Profile() {
  const nameId = useId()
  const [me, setMe] = useState(null)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .me()
      .then((m) => {
        if (!alive) return
        setMe(m)
        setName(m.user.displayName ?? '')
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  async function saveName(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.updateMe({ displayName: name.trim() || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <Notice tone="error">{error}</Notice>
      </div>
    )
  }
  if (!me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted" role="status">
        <LoaderCircle className="size-8 animate-spin text-sky" />
        <span className="sr-only">Loading profile</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="hero-surface grid items-center gap-6 overflow-hidden rounded-[2rem] p-6 text-navy sm:p-10 md:grid-cols-[auto_1fr]">
        <Mascot state="idle" size={120} />
        <div>
          <p className="font-bold text-orange-700">Profile</p>
          <h1 className="mt-1 text-4xl font-medium sm:text-5xl">{me.user.displayName || 'Traveller'}</h1>
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy/5" aria-labelledby="you-h">
          <h2 id="you-h" className="flex items-center gap-2 text-xl font-medium">
            <UserRound className="size-5 text-sky-600" /> About you
          </h2>
          <form onSubmit={saveName} className="mt-4 space-y-3">
            <div>
              <label htmlFor={nameId} className="text-sm font-bold">
                Display name <span className="font-semibold text-muted">(optional)</span>
              </label>
              <input
                id={nameId}
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should Orbi greet you?"
                className="mt-1.5 h-12 w-full rounded-xl px-4 ring-1 ring-navy/15 focus:ring-2 focus:ring-sky focus:outline-none"
              />
            </div>
            <button type="submit" className={buttonClass('dark', 'md')}>
              Save
            </button>
            <p className="text-sm text-success-700" aria-live="polite">
              {saved && 'Saved!'}
            </p>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy/5" aria-labelledby="priv-h">
          <h2 id="priv-h" className="flex items-center gap-2 text-xl font-medium">
            <ShieldCheck className="size-5 text-success-700" /> Your data
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Your account is a private guest session tied to this browser — no email or password needed.</li>
            <li>ORBIT never asks for passport, visa or ticket numbers, and blocks long numbers in item names.</li>
            <li>WhatsApp numbers are kept only while reminders are on for a trip, and are masked everywhere in the app.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
