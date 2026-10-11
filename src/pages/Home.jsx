import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import {
  ArrowDown,
  ArrowRight,
  BellRing,
  Clock,
  Coffee,
  Compass,
  Footprints,
  LoaderCircle,
  LocateFixed,
  Sparkles,
  TrainFront,
} from 'lucide-react'
import SmartImage from '../components/ui/SmartImage'
import JourneyHub from '../components/home/JourneyHub'
import Mascot from '../components/mascot/Mascot'
import ChecklistTeaser from '../components/home/ChecklistTeaser'
import { OrbitMark } from '../components/ui/Logo'
import { useOrbitStore } from '../store/useOrbitStore'
import { useGeolocation } from '../hooks/useGeolocation'
import { describeCurrentLocation } from '../services/locationService'
import { buttonClass } from '../lib/ui'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

function Hero() {
  return (
    <section className="hero-surface relative overflow-hidden text-navy">
      {/* selective gradient glow */}
      <svg className="pointer-events-none absolute -top-40 -right-40 size-[640px] opacity-[0.12]" viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="100" rx="95" ry="40" fill="none" stroke="#fff" strokeWidth="0.6" transform="rotate(-28 100 100)" />
        <ellipse cx="100" cy="100" rx="70" ry="28" fill="none" stroke="#fff" strokeWidth="0.6" transform="rotate(-28 100 100)" />
      </svg>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-36 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-44">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-sm font-medium text-navy ring-1 ring-navy/10">
            <OrbitMark className="size-5" /> ORBIT · Turn waiting time into an adventure
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] font-medium text-balance sm:text-6xl lg:text-7xl">
            Got time to spare? <span className="text-orange">Make it an adventure.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Discover something interesting before your next departure.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/adventure" className={buttonClass('primary', 'lg')}>
              Find My Adventure <ArrowRight className="size-5" />
            </Link>
            <a href="#how-it-works" className={buttonClass('secondary', 'lg')}>
              Explore How It Works <ArrowDown className="size-5" />
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Clock className="size-4 text-sky" /> Fits your exact window</li>
            <li className="flex items-center gap-2"><BellRing className="size-4 text-sky" /> Return-on-time reminders</li>
            <li className="flex items-center gap-2"><Sparkles className="size-4 text-sky" /> No sign-up needed</li>
          </ul>
        </motion.div>

        <HeroVisual />
      </div>
    </section>
  )
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="relative mx-auto w-full max-w-lg"
      aria-hidden="true"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] border border-dashed border-white/15" />
      <SmartImage
        image="traveler"
        alt=""
        width={900}
        eager
        icon={TrainFront}
        className="aspect-[4/5] w-full rounded-[2rem] shadow-2xl ring-1 ring-white/10 sm:aspect-[5/5]"
      />
      <div className="absolute inset-0 rounded-[2rem] bg-linear-to-t from-navy/70 via-transparent to-transparent" />

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-6 -left-4 rounded-2xl bg-white p-3.5 pr-5 text-navy shadow-lift sm:-left-10"
      >
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">Next departure</p>
        <p className="mt-0.5 flex items-center gap-2 font-display text-xl font-bold">
          <TrainFront className="size-5 text-sky" /> 18:40 · Platform 4
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">
          <Clock className="size-3" /> 45 min to spare
        </p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute -right-3 bottom-24 w-60 rounded-2xl bg-white p-3 text-navy shadow-lift sm:-right-8"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700">
            <Coffee className="size-5" />
          </span>
          <div>
            <p className="font-semibold leading-tight">Irani café breakfast</p>
            <p className="mt-0.5 text-xs text-muted">8 min walk · ₹120</p>
          </div>
        </div>
        <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
          <span className="w-[18%] bg-sky" />
          <span className="w-[46%] bg-orange" />
          <span className="w-[18%] bg-sky" />
          <span className="w-[18%] bg-success" />
        </div>
      </motion.div>

      {/* Orbi — the one animated focal element in the hero */}
      <div className="absolute -bottom-6 -left-4 sm:-left-12">
        <Mascot state="welcome" size={120} message="I’ll remind you to head back at 18:22!" />
      </div>
    </motion.div>
  )
}

/** Compact, secondary entry into nearby discovery — no trip details required. */
function QuickStart() {
  const navigate = useNavigate()
  const updatePreferences = useOrbitStore((s) => s.updatePreferences)
  const geo = useGeolocation()

  async function exploreNearby() {
    const coords = await geo.request()
    if (coords) {
      updatePreferences({ location: { label: describeCurrentLocation(coords).label, coords, source: 'geo' } })
      navigate('/adventure/discover')
    } else {
      // Permission denied/unavailable: open discovery so the user can pick a city or search instead
      navigate('/adventure/discover', { state: { locateFailed: true } })
    }
  }

  return (
    <section aria-labelledby="quick-start-title" className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-navy/5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-orange-700" aria-hidden="true">
            <Compass className="size-5" />
          </span>
          <div>
            <h2 id="quick-start-title" className="text-lg font-medium">
              Quick start
            </h2>
            <p className="text-muted">Explore nearby places without setting up a trip.</p>
          </div>
        </div>
        <button type="button" onClick={exploreNearby} disabled={geo.status === 'requesting'} className={buttonClass('dark', 'md', 'shrink-0')}>
          {geo.status === 'requesting' ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          {geo.status === 'requesting' ? 'Finding you…' : 'Explore Nearby'}
        </button>
      </div>
    </section>
  )
}

const STEPS = [
  {
    icon: Clock,
    title: 'Tell us how much time you have',
    text: 'Pick your free window, budget and interests. Add a return time and we’ll keep a safety buffer for you.',
    accent: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Compass,
    title: 'Discover activities that fit your plans',
    text: 'Every suggestion includes travel there and back, so the time and cost you see is the real total.',
    accent: 'bg-orange-50 text-orange-700',
  },
  {
    icon: Footprints,
    title: 'Start your adventure and return on time',
    text: 'A live timer tracks your adventure and reminds you when it’s time to head back — no missed departures.',
    accent: 'bg-success-50 text-success-700',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <motion.div {...fadeUp} className="max-w-2xl">
        <p className="text-sm font-semibold text-orange-700">How it works</p>
        <h2 className="mt-2 text-4xl font-medium sm:text-5xl">Three steps from waiting to wandering</h2>
      </motion.div>
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            {...fadeUp}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative overflow-hidden rounded-3xl bg-white p-7 shadow-card ring-1 ring-navy/5"
          >
            <span className="pointer-events-none absolute -top-4 right-4 font-display text-[7rem] leading-none font-medium text-navy/[0.04]">
              {i + 1}
            </span>
            <span className={`grid size-12 place-items-center rounded-2xl ${s.accent}`}>
              <s.icon className="size-6" />
            </span>
            <p className="mt-6 text-sm font-semibold text-muted">Step {i + 1}</p>
            <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{s.text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-navy via-navy-800 to-navy-700 px-6 py-16 text-center text-white sm:px-12"
      >
        <svg className="pointer-events-none absolute top-1/2 left-1/2 w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-20" viewBox="0 0 400 160" aria-hidden="true">
          <ellipse cx="200" cy="80" rx="190" ry="60" fill="none" stroke="#0EA5E9" strokeWidth="1" />
          <circle cx="368" cy="52" r="6" fill="#FF8A4C" />
        </svg>
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-4xl font-medium text-balance sm:text-5xl">
            Your next adventure might be closer than you think.
          </h2>
          <Link to="/adventure" className={buttonClass('primary', 'lg', 'mt-9')}>
            Find My Adventure <ArrowRight className="size-5" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <JourneyHub />
      <QuickStart />
      <ChecklistTeaser />
      <HowItWorks />
      <FinalCta />
    </>
  )
}
