import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Clock, Heart, Lightbulb, MapPin, Trash2, Undo2 } from 'lucide-react'
import SmartImage from '../components/ui/SmartImage'
import { CategoryBadge } from '../components/adventure/AdventureCard'
import { getAdventure, getHub } from '../data/adventures'
import { INTEREST_MAP } from '../data/options'
import { useOrbitStore } from '../store/useOrbitStore'
import { formatCost, formatMinutes } from '../lib/format'
import PageHero from '../components/ui/PageHero'
import EmptyState from '../components/ui/EmptyState'
import { buttonClass } from '../lib/ui'

export default function Saved() {
  const saved = useOrbitStore((s) => s.saved)
  const removeSaved = useOrbitStore((s) => s.removeSaved)
  const clearSaved = useOrbitStore((s) => s.clearSaved)
  const restoreSaved = useOrbitStore((s) => s.restoreSaved)
  const [confirmClear, setConfirmClear] = useState(false)
  const [lastRemoved, setLastRemoved] = useState(null) // { entry, index, name }

  // Undo toast auto-dismisses after 6 seconds
  useEffect(() => {
    if (!lastRemoved) return
    const id = setTimeout(() => setLastRemoved(null), 6000)
    return () => clearTimeout(id)
  }, [lastRemoved])

  function remove(entry, name) {
    setLastRemoved({ entry: { id: entry.id, savedAt: entry.savedAt }, index: saved.findIndex((x) => x.id === entry.id), name })
    removeSaved(entry.id)
  }

  // Ignore ids that no longer exist in the catalogue
  const items = saved.map((s) => ({ ...s, activity: getAdventure(s.id) ?? s.snapshot ?? null })).filter((s) => s.activity)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHero
        eyebrow="Saved adventures"
        title="Your shortlist"
        description={
          items.length
            ? `${items.length} saved ${items.length === 1 ? 'adventure' : 'adventures'} — stored on this device.`
            : 'Saved adventures are stored on this device.'
        }
      >
        {items.length > 1 &&
          (confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Remove all?</span>
              <button
                type="button"
                onClick={() => {
                  clearSaved()
                  setConfirmClear(false)
                }}
                className={buttonClass('danger', 'sm')}
              >
                Yes, clear
              </button>
              <button type="button" onClick={() => setConfirmClear(false)} className={buttonClass('secondary', 'sm')}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmClear(true)} className={buttonClass('secondary', 'sm')}>
              <Trash2 className="size-4" /> Clear all
            </button>
          ))}
      </PageHero>

      {items.length === 0 ? (
        <EmptyState as="h2" mascot="idle" title="No saved adventures yet" text="Tap the heart on any adventure to keep it here for your next layover.">
          <Link to="/adventure" className={buttonClass('primary', 'lg')}>
            <Heart className="size-5" /> Find My Adventure <ArrowRight className="size-5" />
          </Link>
        </EmptyState>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {items.map(({ id, activity, savedAt }) => (
              <motion.li
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="group relative flex overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy/5 transition-shadow hover:shadow-lift"
              >
                <SmartImage
                  image={activity.image}
                  alt={activity.name}
                  width={400}
                  icon={INTEREST_MAP[activity.category]?.icon}
                  className="w-32 shrink-0 sm:w-44"
                />
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <CategoryBadge id={activity.category} className="bg-sky-50 shadow-none" />
                    <button
                      type="button"
                      onClick={() => remove({ id, savedAt }, activity.name)}
                      className="relative z-10 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-red-50 hover:text-danger"
                      aria-label={`Remove ${activity.name} from saved`}
                      title="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <h2 className="mt-2 text-lg leading-snug font-medium">
                    <Link to={`/adventure/${id}`} className="after:absolute after:inset-0">
                      {activity.name}
                    </Link>
                  </h2>
                  <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted">
                    {activity.generic ? <Lightbulb className="size-3.5 shrink-0" /> : <MapPin className="size-3.5 shrink-0" />}
                    {activity.generic ? 'Idea for anywhere' : `${activity.area}, ${getHub(activity.hub)?.city}`}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 text-sky" /> {formatMinutes(activity.duration.min)}–{formatMinutes(activity.duration.max)}
                    </span>
                    <span className="font-semibold">{formatCost(activity.cost)}</span>
                    <span className="text-xs text-muted">
                      Saved {new Date(savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[950] flex justify-center px-4 md:bottom-6">
        <AnimatePresence>
          {lastRemoved && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-navy py-1.5 pr-1.5 pl-5 text-sm text-white shadow-lift"
            >
              <span>
                Removed <strong>{lastRemoved.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  restoreSaved(lastRemoved.entry, lastRemoved.index)
                  setLastRemoved(null)
                }}
                className={buttonClass('primary', 'sm')}
              >
                <Undo2 className="size-4" /> Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
