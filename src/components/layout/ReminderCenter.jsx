import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Footprints, Hourglass, Timer, TriangleAlert } from 'lucide-react'
import { useOrbitStore } from '../../store/useOrbitStore'
import { useNow } from '../../hooks/useNow'
import { playChime } from '../../lib/chime'
import { formatClock, formatCountdown } from '../../lib/format'
import { buttonClass } from '../../lib/ui'

const ALERTS = {
  warned: {
    icon: Hourglass,
    tone: 'bg-sky-600 text-white',
    title: 'Five minutes left',
    body: (a) => `Start wrapping up — you should leave ${a.name} by ${formatClock(a.leaveBy)}.`,
  },
  leave: {
    icon: BellRing,
    tone: 'bg-orange text-white',
    title: 'Time to head back',
    body: (a, now) =>
      `Leave now to be back at ${a.startLabel} around ${formatClock(Math.max(now + a.travelOneWay * 60000, a.returnBy - a.buffer * 60000))} — before your ${formatClock(a.returnBy)} deadline.`,
  },
  overdue: {
    icon: TriangleAlert,
    tone: 'bg-danger text-white',
    title: 'You should be back now',
    body: (a) => `Your return time of ${formatClock(a.returnBy)} has passed. Head to your departure point straight away.`,
  },
}

/** Watches the active adventure everywhere in the app and raises in-app reminders. */
export default function ReminderCenter() {
  const active = useOrbitStore((s) => s.active)
  const markAlert = useOrbitStore((s) => s.markAlert)
  const setActiveStatus = useOrbitStore((s) => s.setActiveStatus)
  const snoozeLeave = useOrbitStore((s) => s.snoozeLeave)
  const soundEnabled = useOrbitStore((s) => s.soundEnabled)
  const running = Boolean(active && active.status !== 'completed')
  const now = useNow(1000, running)
  const [shown, setShown] = useState(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!running) return
    const a = active
    let key = null
    if (now >= a.returnBy && !a.alerts.overdue) key = 'overdue'
    else if (now >= a.leaveBy && now < a.returnBy && !a.alerts.leave && a.status === 'active') key = 'leave'
    else if (now >= a.warnAt && now < a.leaveBy && !a.alerts.warned && a.status === 'active') key = 'warned'
    if (key) {
      markAlert(key)
      // Mark earlier alerts too so a late page-load doesn't show a stale sequence
      if (key !== 'warned') markAlert('warned')
      if (key === 'overdue') markAlert('leave')
      // Defer state update out of the effect body
      queueMicrotask(() => setShown(key))
      if (soundEnabled) playChime(key !== 'warned')
    }
  }, [now, running, active, markAlert, soundEnabled])

  // Escape closes the informational 5-minute warning; the head-back alerts need an explicit choice
  useEffect(() => {
    if (shown !== 'warned') return
    const onKey = (e) => e.key === 'Escape' && setShown(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shown])

  const alert = shown && active ? ALERTS[shown] : null
  const latest = active ? active.returnBy - active.travelOneWay * 60000 : 0
  const canSnooze = shown === 'leave' && active && latest - now >= 2 * 60000

  return (
    <>
      <AnimatePresence>
        {alert && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-end justify-center bg-navy/50 p-4 backdrop-blur-[2px] sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reminder-title"
              aria-describedby="reminder-body"
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className={`${alert.tone} flex items-center gap-3 px-6 py-5`}>
                <motion.span
                  animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                  transition={{ duration: 0.8, repeat: 2 }}
                  className="grid size-11 place-items-center rounded-full bg-white/20"
                >
                  <alert.icon className="size-6" />
                </motion.span>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase">ORBIT reminder</p>
                  <h2 id="reminder-title" className="text-2xl font-medium">
                    {alert.title}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <p id="reminder-body" className="text-[15px] leading-relaxed text-navy">
                  {alert.body(active, now)}
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                  {shown === 'warned' ? (
                    <button className={buttonClass('dark', 'md', 'flex-1')} onClick={() => setShown(null)} autoFocus>
                      Got it
                    </button>
                  ) : (
                    <button
                      className={buttonClass('primary', 'md', 'flex-1')}
                      onClick={() => {
                        setActiveStatus('returning')
                        setShown(null)
                        if (pathname !== '/adventure/live') navigate('/adventure/live')
                      }}
                      autoFocus
                    >
                      <Footprints className="size-4" /> I’m heading back
                    </button>
                  )}
                  {canSnooze && (
                    <button
                      className={buttonClass('secondary', 'md', 'flex-1')}
                      onClick={() => {
                        snoozeLeave(2)
                        setShown(null)
                      }}
                    >
                      2 more minutes
                    </button>
                  )}
                </div>
                {canSnooze && (
                  <p className="mt-3 text-center text-xs text-muted">Extra minutes come out of your safety buffer.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {running && pathname !== '/adventure/live' && !alert && (
        <LivePill active={active} now={now} onOpen={() => navigate('/adventure/live')} />
      )}
    </>
  )
}

function LivePill({ active, now, onOpen }) {
  const returning = active.status === 'returning'
  const target = returning ? active.returnBy : active.leaveBy
  const late = now > target
  return (
    <motion.button
      type="button"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={onOpen}
      className="fixed right-4 bottom-24 z-[900] flex cursor-pointer items-center gap-3 rounded-full bg-navy py-2 pr-5 pl-2 text-left text-white shadow-lift md:bottom-6"
      aria-label="Open live adventure timer"
    >
      <span className={`grid size-10 place-items-center rounded-full ${late ? 'bg-danger' : 'bg-orange'} text-navy`}>
        <Timer className="size-5" />
      </span>
      <span>
        <span className="block text-xs font-medium tracking-wide text-white/70 uppercase">
          {returning ? 'Back by' : late ? 'Leave now' : 'Leave in'}
        </span>
        <span className="block font-display text-lg leading-tight font-bold tabular-nums">
          {returning ? formatClock(active.returnBy) : late ? `+${formatCountdown(now - target)}` : formatCountdown(target - now)}
        </span>
      </span>
    </motion.button>
  )
}
