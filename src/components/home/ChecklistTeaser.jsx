import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Luggage } from 'lucide-react'
import Mascot from '../mascot/Mascot'
import { ReadinessRing } from '../game/GameUI'
import { countdown } from '../../data/trips'
import { api } from '../../services/orbitApi'
import { useNow } from '../../hooks/useNow'
import { buttonClass } from '../../lib/ui'

/** Homepage entry point for "Did I Forget Something?". Hidden if the API isn't reachable. */
export default function ChecklistTeaser() {
  const [state, setState] = useState({ status: 'loading' })
  const now = useNow(60000)

  useEffect(() => {
    let alive = true
    api
      .dashboard()
      .then((d) => alive && setState({ status: 'ready', data: d }))
      .catch(() => alive && setState({ status: 'unavailable' }))
    return () => {
      alive = false
    }
  }, [])

  if (state.status !== 'ready') return null
  const { nextTrip, trips } = state.data
  const trip = nextTrip ?? null

  return (
    <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8" aria-labelledby="dif-title">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        className="grid items-center gap-6 overflow-hidden rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-navy/5 sm:p-8 md:grid-cols-[auto_1fr_auto]"
      >
        <Mascot state={trip ? (trip.readiness.completionPct === 100 ? 'ready' : 'reminder') : 'welcome'} size={120} />
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-orange-700">
            <Luggage className="size-4" /> Did I forget something?
          </p>
          {trip ? (
            <>
              <h2 id="dif-title" className="mt-1 text-3xl font-medium">
                {trip.name || `Trip to ${trip.destinationCity}`}
              </h2>
              <p className="mt-1 text-muted">
                {trip.departureAt > now ? `Departs in ${countdown(trip.departureAt - now)}` : 'Departed'} · {trip.readiness.completed} of {trip.readiness.total} items checked
              </p>
            </>
          ) : (
            <>
              <h2 id="dif-title" className="mt-1 text-3xl font-medium">
                {trips.length ? 'Plan your next trip checklist' : 'Never leave without the essentials'}
              </h2>
              <p className="mt-1 max-w-xl text-muted">
                Get a personalised packing and documents checklist, and WhatsApp reminders before you leave.
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-3">
          {trip && <ReadinessRing score={trip.readiness.score} size={96} stroke={9} label="Ready" />}
          <Link to={trip ? `/trips/${trip.id}` : '/trips/new'} className={buttonClass('dark', 'md')}>
            {trip ? 'Continue packing' : 'Create a trip checklist'} <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
