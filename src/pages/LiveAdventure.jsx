import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  BellRing,
  CarFront,
  CircleCheck,
  Flag,
  Footprints,
  Hourglass,
  MapPin,
  Timer,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import AdventureMap from '../components/map/AdventureMap'
import SmartImage from '../components/ui/SmartImage'
import Notice from '../components/ui/Notice'
import { useOrbitStore } from '../store/useOrbitStore'
import { useNow } from '../hooks/useNow'
import { formatClock, formatCountdown, formatMinutes } from '../lib/format'
import { buttonClass, cn } from '../lib/ui'
import SafetyMeter from '../components/adventure/SafetyMeter'
import EmptyState from '../components/ui/EmptyState'
import Mascot from '../components/mascot/Mascot'
import { safetyFromActive } from '../lib/planner'

function getPhase(a, now) {
  if (a.status === 'completed') return 'completed'
  if (a.status === 'returning') return now > a.returnBy ? 'late' : 'returning'
  if (now >= a.leaveBy) return 'leave'
  if (now >= a.warnAt) return 'wrap'
  if (now < a.arriveAt) return 'outbound'
  return 'enjoy'
}

const PHASES = {
  outbound: { label: 'On your way', icon: Footprints, color: '#0EA5E9', text: 'Heading to your adventure' },
  enjoy: { label: 'Enjoy!', icon: Timer, color: '#FF8A4C', text: 'Time left before you head back' },
  wrap: { label: 'Wrap up', icon: Hourglass, color: '#FF8A4C', text: 'Start finishing up — leave soon' },
  leave: { label: 'Head back now', icon: BellRing, color: '#C53030', text: 'You should be leaving now' },
  returning: { label: 'Heading back', icon: Footprints, color: '#10B981', text: 'Time until your deadline' },
  late: { label: 'Past your deadline', icon: BellRing, color: '#C53030', text: 'Get to your departure point now' },
}

function Ring({ progress, color, children }) {
  const r = 120
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox="0 0 280 280" className="size-full -rotate-90">
        <circle cx="140" cy="140" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="14" />
        <circle
          cx="140"
          cy="140"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export default function LiveAdventure() {
  const active = useOrbitStore((s) => s.active)
  const setActiveStatus = useOrbitStore((s) => s.setActiveStatus)
  const completeAdventure = useOrbitStore((s) => s.completeAdventure)
  const endAdventure = useOrbitStore((s) => s.endAdventure)
  const soundEnabled = useOrbitStore((s) => s.soundEnabled)
  const setSoundEnabled = useOrbitStore((s) => s.setSoundEnabled)
  const now = useNow(1000, Boolean(active))
  const navigate = useNavigate()
  const [confirmEnd, setConfirmEnd] = useState(false)

  if (!active) {
    return (
      <EmptyState mascot="idle" title="No live adventure right now" text="Pick an adventure and tap “Start Adventure” — we’ll time it and remind you when to head back.">
        <Link to="/adventure" className={buttonClass('primary', 'lg')}>
          <Timer className="size-5" /> Find My Adventure
        </Link>
      </EmptyState>
    )
  }

  const phase = getPhase(active, now)

  if (phase === 'completed') {
    const early = Math.round((active.returnBy - active.completedAt) / 60000)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="flex justify-center">
          <Mascot state={early >= 0 ? 'ready' : 'reminder'} size={160} />
        </div>
        <h1 className="mt-4 text-4xl font-medium">Adventure complete!</h1>
        <p className="mt-3 text-lg text-muted">
          You explored <strong className="text-navy">{active.name}</strong>
          {early >= 0 ? (
            <> and made it back with <strong className="text-success-700">{formatMinutes(early)}</strong> to spare.</>
          ) : (
            <> — you were {formatMinutes(-early)} past your deadline. Safe travels!</>
          )}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              endAdventure()
              navigate('/adventure')
            }}
            className={buttonClass('primary', 'lg')}
          >
            Plan another adventure
          </button>
          <button
            type="button"
            onClick={() => {
              endAdventure()
              navigate('/')
            }}
            className={buttonClass('secondary', 'lg')}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  const meta = PHASES[phase]
  const returning = phase === 'returning' || phase === 'late'
  const target = returning ? active.returnBy : active.leaveBy
  const remaining = target - now
  const progress = returning
    ? (now - active.leaveBy) / Math.max(1, active.returnBy - active.leaveBy)
    : (now - active.startedAt) / Math.max(1, active.leaveBy - active.startedAt)
  const backAt = active.leaveBy + active.travelOneWay * 60000
  const TravelIcon = active.travelMode === 'walk' ? Footprints : CarFront
  const safety = safetyFromActive(active)

  const timeline = [
    { t: active.startedAt, label: 'Started', done: true },
    { t: active.arriveAt, label: `Arrive at ${active.name}`, done: now >= active.arriveAt },
    ...(safety.spareMinutes > 0 ? [{ t: active.arriveAt + safety.activityMinutes * 60000, label: 'Planned activity ends', done: now >= active.arriveAt + safety.activityMinutes * 60000 }] : []),
    { t: active.warnAt, label: '5-minute warning', done: now >= active.warnAt },
    { t: active.leaveBy, label: 'Leave to head back', done: now >= active.leaveBy || returning, highlight: true },
    { t: backAt, label: `Back at ${active.startLabel}`, done: false },
    { t: active.returnBy, label: 'Deadline (buffer ends)', done: false },
  ].sort((a, b) => a.t - b.t)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Timer panel */}
        <section className="relative overflow-hidden rounded-[2rem] bg-navy p-6 text-white shadow-lift sm:p-8" aria-labelledby="live-title">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgb(74_144_226/0.35),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full opacity-75" style={{ background: meta.color }} />
                  <span className="relative inline-flex size-2.5 rounded-full" style={{ background: meta.color }} />
                </span>
                Live adventure
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-pressed={soundEnabled}
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-cream/75 sm:h-9 ring-1 ring-white/15 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                {soundEnabled ? 'Sound on' : 'Sound off'}
              </button>
            </div>

            <h1 id="live-title" className="mt-5 text-2xl font-medium sm:text-3xl">
              {active.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-cream/70">
              <MapPin className="size-4" /> {active.area}
            </p>

            <div className="mt-8">
              <Ring progress={progress} color={meta.color}>
                <meta.icon className="size-7" style={{ color: meta.color }} />
                <p className="mt-2 text-sm font-semibold tracking-wide uppercase" style={{ color: meta.color }}>
                  {meta.label}
                </p>
                <p className="mt-1 font-display text-6xl font-medium tabular-nums sm:text-7xl" aria-live="off">
                  {remaining < 0 ? '+' : ''}
                  {formatCountdown(remaining)}
                </p>
                <p className="mt-1 max-w-[200px] text-sm text-cream/70">{meta.text}</p>
              </Ring>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-xs text-cream/60">{returning ? 'Back at start by' : 'Leave by'}</p>
                <p className="mt-0.5 font-display text-2xl font-bold">{formatClock(returning ? backAt : active.leaveBy)}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-xs text-cream/60">Hard deadline</p>
                <p className="mt-0.5 font-display text-2xl font-bold">{formatClock(active.returnBy)}</p>
              </div>
            </div>

            <SafetyMeter safety={safety} variant="full" dark elapsedMinutes={(now - active.startedAt) / 60000} className="mt-6 rounded-2xl bg-white/5 p-4" />

            <div className="mt-6 flex flex-col gap-3">
              {returning ? (
                <button type="button" onClick={completeAdventure} className={buttonClass('primary', 'lg', 'w-full')}>
                  <Flag className="size-5" /> I’m back — complete adventure
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveStatus('returning')}
                  className={buttonClass(phase === 'leave' || phase === 'wrap' ? 'primary' : 'outlineLight', 'lg', 'w-full')}
                >
                  <TravelIcon className="size-5" /> I’m heading back now
                </button>
              )}
              {confirmEnd ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      endAdventure()
                      navigate('/adventure/results')
                    }}
                    className={buttonClass('danger', 'md', 'flex-1')}
                  >
                    Yes, end it
                  </button>
                  <button type="button" onClick={() => setConfirmEnd(false)} className={buttonClass('outlineLight', 'md', 'flex-1')}>
                    Keep going
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmEnd(true)}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 text-sm font-medium text-cream/70 hover:text-cream"
                >
                  <X className="size-4" /> End adventure without completing
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Plan details */}
        <section className="space-y-6">
          {phase === 'leave' && (
            <Notice tone="error">
              It’s time to head back. Leaving now keeps your {active.buffer}-minute safety buffer intact.
            </Notice>
          )}
          {phase === 'late' && <Notice tone="error">Your deadline has passed — head straight to your departure point.</Notice>}

          <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy/5">
            <SmartImage image={active.image} alt={active.name} width={800} className="h-40 w-full" />
            <div className="p-6">
              <h2 className="text-lg font-medium">Your timeline</h2>
              <ol className="mt-4 space-y-4">
                {timeline.map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full',
                        item.done ? 'bg-success text-white' : item.highlight ? 'bg-orange-50 text-orange-700 ring-1 ring-orange' : 'bg-navy/5 text-muted',
                      )}
                    >
                      {item.done ? <CircleCheck className="size-4" /> : <span className="size-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={cn('flex-1 text-[15px]', item.done ? 'text-muted line-through decoration-navy/20' : 'text-navy')}>
                      {item.label}
                    </span>
                    <span className={cn('font-semibold tabular-nums', item.highlight && !item.done && 'text-orange-700')}>
                      {formatClock(item.t)}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-sm text-muted">
                <TravelIcon className="size-4 text-sky" />
                {active.travelMode === 'walk' ? 'Walk' : 'Auto/taxi'} · about {active.travelOneWay} min each way · {active.buffer} min buffer
              </p>
            </div>
          </div>

          {active.coords && active.startCoords && (
            <AdventureMap
              start={{ coords: active.startCoords, label: active.startLabel }}
              places={[{ id: active.activityId, name: active.name, coords: active.coords, label: '★' }]}
              className="h-64"
            />
          )}
          <p className="text-center text-xs text-muted">
            Keep this tab open for reminders. ORBIT reminders are in-app only — always keep an eye on official departure boards.
          </p>
        </section>
      </div>
    </div>
  )
}
