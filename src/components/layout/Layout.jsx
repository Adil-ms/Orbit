import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Compass, Heart, House, Luggage, Timer, UserRound } from 'lucide-react'
import Logo from '../ui/Logo'
import ReminderCenter from './ReminderCenter'
import { useOrbitStore } from '../../store/useOrbitStore'
import { buttonClass, cn } from '../../lib/ui'

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/adventure', label: 'Find an Adventure', short: 'Explore', icon: Compass, match: (p) => p.startsWith('/adventure') },
  { to: '/trips', label: 'Trip Checklists', short: 'Trips', icon: Luggage },
  { to: '/saved', label: 'Saved', short: 'Saved', icon: Heart },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: UserRound, mobileOnly: true },
]


function useIsActive() {
  const { pathname } = useLocation()
  return (item) => (item.match ? item.match(pathname) : item.end ? pathname === item.to : pathname.startsWith(item.to))
}

function SavedCount() {
  const count = useOrbitStore((s) => s.saved.length)
  if (!count) return null
  return (
    <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1.5 text-xs font-bold text-navy">
      {count}
    </span>
  )
}

function Header() {
  const isActive = useIsActive()
  const active = useOrbitStore((s) => s.active)
  return (
    <header className="sticky top-0 z-[800] border-b border-navy/5 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="ORBIT home" className="flex h-11 items-center rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.filter((n) => !n.mobileOnly).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                'relative inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors',
                isActive(item) ? 'bg-navy text-white' : 'text-navy/75 hover:bg-navy/5 hover:text-navy',
              )}
              aria-current={isActive(item) ? 'page' : undefined}
            >
              {item.label}
              {item.to === '/saved' && <SavedCount />}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {active && active.status !== 'completed' && (
            <Link to="/adventure/live" className={buttonClass('dark', 'sm')}>
              <Timer className="size-4 text-orange" /> Live
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  const isActive = useIsActive()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[800] border-t border-navy/8 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map((item) => {
          const on = isActive(item)
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                aria-current={on ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-xs font-semibold', on ? 'text-navy' : 'text-navy/70')}
              >
                <span className={cn('grid h-8 w-12 place-items-center rounded-full transition-colors', on && 'bg-orange/20')}>
                  <item.icon className={cn('size-5', on ? 'text-orange-700' : '')} />
                </span>
                <span className="flex items-center">
                  {item.short ?? item.label}
                  {item.to === '/saved' && <SavedCount />}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-auto bg-navy text-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div className="max-w-md">
          <Logo light />
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            ORBIT turns waiting time into small adventures and makes sure you never leave without the essentials — with
            personalised checklists, reminders and a little help from Orbi.
          </p>
        </div>
        <div className="text-xs leading-relaxed text-cream/55 md:text-right">
          <p>Places, prices and timings are demonstration data. Entry requirements must be confirmed with official sources.</p>
          <p className="mt-1">Photos via Unsplash · Maps © OpenStreetMap contributors</p>
        </div>
      </div>
    </footer>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    // After a route change, move focus to the main region so screen readers start on the new page
    if (first.current) first.current = false
    else document.getElementById('main')?.focus({ preventScroll: true })
    // Run again on the next frame: lazy pages and in-flight smooth scrolls can otherwise leave us mid-page
    window.scrollTo({ top: 0, behavior: 'instant' })
    const id = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    return () => cancelAnimationFrame(id)
  }, [pathname])
  return null
}

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-[1001] rounded-full bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none md:pb-0">
        <Outlet />
      </main>
      <div className="pb-20 md:pb-0 bg-navy">
        <Footer />
      </div>
      <MobileNav />
      <ReminderCenter />
    </div>
  )
}
