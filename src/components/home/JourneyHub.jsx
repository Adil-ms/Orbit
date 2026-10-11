import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  BusFront,
  Clock,
  Heart,
  Pencil,
  Plane,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  TrainFront,
  Trash2,
} from 'lucide-react'
import Notice from '../ui/Notice'
import SmartImage from '../ui/SmartImage'
import { useOrbitStore } from '../../store/useOrbitStore'
import { useNow } from '../../hooks/useNow'
import { HUBS, getAdventure } from '../../data/adventures'
import { INTEREST_MAP } from '../../data/options'
import { REPORT_OPTIONS, TRIP_MODES, makeSampleTrip, tripToPreferences, tripWindow, validateTrip } from '../../lib/journey'
import { formatClock, formatCost, formatMinutes } from '../../lib/format'
import { buttonClass, cn } from '../../lib/ui'

const MODE_ICONS = { train: TrainFront, flight: Plane, bus: BusFront }
const inputCls =
  'h-11 w-full rounded-xl bg-white px-3.5 text-[15px] text-navy ring-1 ring-navy/12 placeholder:text-muted/70 focus:ring-2 focus:ring-sky focus:outline-none aria-invalid:ring-danger'

function TripForm({ initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(
    initial ?? { mode: 'train', name: '', station: '', departure: '', reportBefore: TRIP_MODES.train.reportBefore },
  )
  const [errors, setErrors] = useState({})
  const ids = { name: useId(), station: useId(), departure: useId() }
  const update = (patch) => {
    setDraft((d) => ({ ...d, ...patch }))
    // Clear errors for fields the user is fixing
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch))))
  }

  function submit(e) {
    e.preventDefault()
    const next = validateTrip(draft)
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({ ...draft, name: draft.name.trim(), station: draft.station.trim(), reportBefore: Number(draft.reportBefore), isSample: false })
  }

  const err = (k) =>
    errors[k] && (
      <p id={`${ids[k] ?? k}-error`} className="mt-1.5 text-sm font-medium text-orange" role="alert">
        {errors[k]}
      </p>
    )

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div role="radiogroup" aria-label="Travel mode" className="flex gap-1.5 rounded-full bg-white/10 p-1">
        {Object.entries(TRIP_MODES).map(([id, m]) => {
          const Icon = MODE_ICONS[id]
          const on = draft.mode === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => update({ mode: id, reportBefore: m.reportBefore })}
              className={cn(
                'inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors',
                on ? 'bg-white text-navy' : 'text-cream/75 hover:text-white',
              )}
            >
              <Icon className="size-4" /> {m.label}
            </button>
          )
        })}
      </div>

      <div>
        <label htmlFor={ids.station} className="text-sm font-medium text-cream/80">
          Leaving from
        </label>
        <input
          id={ids.station}
          value={draft.station}
          maxLength={80}
          onChange={(e) => update({ station: e.target.value })}
          placeholder="e.g. Mumbai CSMT"
          aria-invalid={Boolean(errors.station)}
          aria-required="true"
          aria-describedby={errors.station ? `${ids.station}-error` : undefined}
          className={cn(inputCls, 'mt-1.5')}
        />
        {err('station')}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HUBS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => update({ station: h.name })}
              className="cursor-pointer rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-cream/85 hover:bg-white/20"
            >
              {h.city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.departure} className="text-sm font-medium text-cream/80">
            Departure time
          </label>
          <input
            id={ids.departure}
            type="time"
            value={draft.departure}
            onChange={(e) => update({ departure: e.target.value })}
            aria-invalid={Boolean(errors.departure)}
            aria-required="true"
            aria-describedby={errors.departure ? `${ids.departure}-error` : undefined}
            className={cn(inputCls, 'mt-1.5')}
          />
          {err('departure')}
        </div>
        <div>
          <label htmlFor={ids.name} className="text-sm font-medium text-cream/80">
            Trip label <span className="text-cream/50">(optional)</span>
          </label>
          <input
            id={ids.name}
            value={draft.name}
            maxLength={60}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Train to Pune"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${ids.name}-error` : undefined}
            className={cn(inputCls, 'mt-1.5')}
          />
          {err('name')}
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-cream/80">Be back at the {TRIP_MODES[draft.mode].place} this early</legend>
        <div role="radiogroup" aria-label="Arrive before departure" className="mt-1.5 flex flex-wrap gap-1.5">
          {REPORT_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={Number(draft.reportBefore) === r}
              onClick={() => update({ reportBefore: r })}
              className={cn(
                'h-11 cursor-pointer rounded-full px-3 text-sm sm:h-8 font-semibold transition-colors',
                Number(draft.reportBefore) === r ? 'bg-orange text-white' : 'bg-white/10 text-cream/85 hover:bg-white/20',
              )}
            >
              {r} min
            </button>
          ))}
        </div>
      </fieldset>

      <p className="flex items-start gap-1.5 text-xs text-cream/55">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" /> Stored only in this browser. Don’t add PNR, ticket or passport numbers.
      </p>
      <div className="flex gap-2">
        <button type="submit" className={buttonClass('primary', 'md', 'flex-1')}>
          Save trip
        </button>
        <button type="button" onClick={onCancel} className={buttonClass('outlineLight', 'md')}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function TripCard({ trip, win, onEdit, onRemove }) {
  const Icon = MODE_ICONS[trip.mode] ?? TrainFront
  const mode = TRIP_MODES[trip.mode] ?? TRIP_MODES.train
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10">
          <Icon className="size-5 text-orange" />
        </span>
        {trip.isSample && (
          <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-bold tracking-wide text-navy uppercase">Sample trip</span>
        )}
      </div>
      <p className="mt-4 text-sm text-cream/65">{trip.name || `${mode.label} from ${trip.station}`}</p>
      <p className="mt-1 font-display text-3xl font-bold">
        {formatClock(win.departureAt)}
        {win.tomorrow && <span className="ml-2 align-middle text-sm font-medium text-cream/60">tomorrow</span>}
      </p>
      <p className="mt-1 text-sm text-cream/75">{trip.station}</p>
      <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-white/8 p-3">
          <dt className="text-xs text-cream/60">Departs in</dt>
          <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">
            {win.status === 'departed' ? '—' : formatMinutes(win.untilDeparture)}
          </dd>
        </div>
        <div className="rounded-xl bg-white/8 p-3">
          <dt className="text-xs text-cream/60">Be at {mode.place} by</dt>
          <dd className="mt-0.5 font-display text-lg font-bold">{formatClock(win.reportAt)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onEdit} className={buttonClass('outlineLight', 'sm', 'flex-1')}>
          <Pencil className="size-3.5" /> Edit trip
        </button>
        <button type="button" onClick={onRemove} className={buttonClass('outlineLight', 'sm')} aria-label="Remove trip">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function JourneyHub() {
  const navigate = useNavigate()
  const trip = useOrbitStore((s) => s.trip)
  const setTrip = useOrbitStore((s) => s.setTrip)
  const clearTrip = useOrbitStore((s) => s.clearTrip)
  const prefs = useOrbitStore((s) => s.preferences)
  const updatePreferences = useOrbitStore((s) => s.updatePreferences)
  const markSearched = useOrbitStore((s) => s.markSearched)
  const saved = useOrbitStore((s) => s.saved)
  const active = useOrbitStore((s) => s.active)
  const now = useNow(15000)
  const [editing, setEditing] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const win = tripWindow(trip, new Date(now))
  const savedItems = saved.map((s) => getAdventure(s.id) ?? s.snapshot ?? null).filter(Boolean)
  const live = active && active.status !== 'completed'
  const canPlan = win?.status === 'ok'

  function findForTrip() {
    const next = tripToPreferences(trip, prefs)
    if (!next) return
    updatePreferences(next)
    markSearched()
    navigate('/adventure/results')
  }

  return (
    <section aria-labelledby="journey-title" className="relative z-10 mx-auto -mt-24 max-w-6xl px-4 sm:px-6 lg:-mt-28 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-[2rem] bg-white p-4 shadow-lift ring-1 ring-navy/5 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-1 px-2 pb-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-orange-700">My Journey</p>
            <h2 id="journey-title" className="text-2xl font-medium sm:text-3xl">
              Your trip at a glance
            </h2>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-3.5 text-success-700" /> Saved on this device · no tickets or ID needed
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
          {/* 1 · Upcoming trip */}
          <div className="rounded-3xl bg-navy p-5 text-white">
            <p className="text-xs font-semibold tracking-wider text-cream/60 uppercase">Upcoming trip</p>
            <div className="mt-3">
              <AnimatePresence mode="wait" initial={false}>
                {editing ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TripForm
                      initial={trip && !trip.isSample ? trip : null}
                      onSave={(t) => {
                        setTrip(t)
                        setEditing(false)
                      }}
                      onCancel={() => setEditing(false)}
                    />
                  </motion.div>
                ) : trip && win ? (
                  <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {confirmRemove ? (
                      <div className="py-6 text-center">
                        <p className="font-semibold">Remove this trip?</p>
                        <p className="mt-1 text-sm text-cream/65">Your saved adventures stay.</p>
                        <div className="mt-4 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              clearTrip()
                              setConfirmRemove(false)
                            }}
                            className={buttonClass('danger', 'sm')}
                          >
                            Remove
                          </button>
                          <button type="button" onClick={() => setConfirmRemove(false)} className={buttonClass('outlineLight', 'sm')}>
                            Keep
                          </button>
                        </div>
                      </div>
                    ) : (
                      <TripCard trip={trip} win={win} onEdit={() => setEditing(true)} onRemove={() => setConfirmRemove(true)} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
                      <TrainFront className="size-6 text-orange" />
                    </span>
                    <p className="mt-4 font-display text-xl font-bold">No trip added yet</p>
                    <p className="mt-1 text-sm text-cream/70">Add your departure time and ORBIT will work out how much free time you have.</p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                      <button type="button" onClick={() => setEditing(true)} className={buttonClass('primary', 'md', 'flex-1')}>
                        <Plus className="size-4" /> Add my trip
                      </button>
                      <button type="button" onClick={() => setTrip(makeSampleTrip())} className={buttonClass('outlineLight', 'md', 'flex-1')}>
                        <Sparkles className="size-4" /> Sample trip
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 2 · Available time + quick actions */}
          <div className="flex flex-col rounded-3xl bg-cream p-5">
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">Available time</p>
            {live ? (
              <div className="mt-3">
                <p className="flex items-center gap-2 font-display text-xl font-bold">
                  <Timer className="size-5 text-orange" /> Adventure in progress
                </p>
                <p className="mt-1 text-sm text-muted">
                  {active.name} · {active.status === 'returning' ? `back by ${formatClock(active.returnBy)}` : `leave by ${formatClock(active.leaveBy)}`}
                </p>
              </div>
            ) : trip && win ? (
              <div className="mt-3">
                <p className="font-display text-4xl font-medium tabular-nums">
                  {win.status === 'departed' ? '—' : formatMinutes(win.available)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {win.status === 'departed'
                    ? 'This departure time has passed.'
                    : `free until ${formatClock(win.reportAt)} (${trip.reportBefore} min before departure)`}
                </p>
                {win.status === 'too-close' && (
                  <Notice tone="warning" className="mt-3">
                    Too close to departure for an adventure. Head to your {TRIP_MODES[trip.mode]?.place ?? 'departure point'}.
                  </Notice>
                )}
                {win.status === 'departed' && (
                  <Notice tone="warning" className="mt-3">
                    Update your trip with your next departure time.
                  </Notice>
                )}
                {canPlan && win.available > 360 && (
                  <p className="mt-2 text-xs text-muted">ORBIT plans breaks of up to 6 hours, so we’ll use the first 6.</p>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="flex items-center gap-2 font-display text-xl font-bold">
                  <Clock className="size-5 text-sky" /> Not set
                </p>
                <p className="mt-1 text-sm text-muted">Add a trip, or just tell us how many minutes you have.</p>
              </div>
            )}

            <div className="mt-auto space-y-2 pt-5">
              {live ? (
                <Link to="/adventure/live" className={buttonClass('dark', 'md', 'w-full')}>
                  <Timer className="size-4 text-orange" /> Open live timer
                </Link>
              ) : canPlan ? (
                // The hub's single primary action once a trip window is known
                <button type="button" onClick={findForTrip} className={buttonClass('primary', 'md', 'w-full')}>
                  Find adventures that fit <ArrowRight className="size-4" />
                </button>
              ) : null}
              {/* Without a usable trip, "Add my trip" is the primary — this stays secondary */}
              <Link to="/adventure" className={buttonClass('secondary', 'md', 'w-full')}>
                <SlidersHorizontal className="size-4" /> {canPlan || live ? 'Adjust preferences' : 'Set my time manually'}
              </Link>
            </div>
          </div>

          {/* 3 · Saved adventures */}
          <div className="flex flex-col rounded-3xl p-5 ring-1 ring-navy/8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">Saved adventures</p>
              {savedItems.length > 0 && (
                <Link to="/saved" className="-my-3 inline-flex min-h-11 items-center text-sm font-semibold text-sky-600 hover:underline">
                  View all ({savedItems.length})
                </Link>
              )}
            </div>
            {savedItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center py-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                  <Heart className="size-5" />
                </span>
                <p className="mt-3 font-semibold">Nothing saved yet</p>
                <p className="mt-1 text-sm text-muted">Tap the heart on any adventure to keep it for your next wait.</p>
                <Link to="/adventure/discover" className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-sky-600 hover:underline">
                  Discover places nearby
                </Link>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {savedItems.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <Link to={`/adventure/${a.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-cream">
                      <SmartImage image={a.image} alt="" width={160} icon={INTEREST_MAP[a.category]?.icon} className="size-12 shrink-0 rounded-xl" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{a.name}</span>
                        <span className="block text-xs text-muted">
                          {formatMinutes(a.duration.min)}–{formatMinutes(a.duration.max)} · {formatCost(a.cost)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {trip?.isSample && !editing && (
          <p className="mt-3 px-2 text-xs text-muted">
            The sample trip is demonstration data.{' '}
            <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-sky-600 hover:underline">
              Add your own trip
            </button>
          </p>
        )}
      </motion.div>
    </section>
  )
}
