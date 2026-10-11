import { LIMITS } from '../data/options'
import { minutesUntil } from './planner'

// How early travellers usually want to be back at the platform / gate / stand
export const TRIP_MODES = {
  train: { label: 'Train', reportBefore: 15, place: 'platform' },
  flight: { label: 'Flight', reportBefore: 60, place: 'gate' },
  bus: { label: 'Bus', reportBefore: 10, place: 'stand' },
}
export const REPORT_OPTIONS = [10, 15, 30, 45, 60, 90]
export const MIN_ADVENTURE_MINUTES = 10

// Rough patterns for things we never want stored: 10-digit PNRs, long ticket numbers, passport-style ids
const SENSITIVE = [/\d{8,}/, /\b[A-Z]\d{7}\b/i, /\bpnr\b/i, /passport/i]

export function validateTrip(trip) {
  const errors = {}
  if (!trip.station?.trim()) errors.station = 'Enter the station or airport you’re leaving from.'
  else if (trip.station.length > 80) errors.station = 'Keep it under 80 characters.'
  if (!/^\d{2}:\d{2}$/.test(trip.departure || '')) errors.departure = 'Enter your departure time.'
  if (trip.name && trip.name.length > 60) errors.name = 'Keep it under 60 characters.'
  for (const field of ['name', 'station']) {
    if (trip[field] && SENSITIVE.some((re) => re.test(trip[field]))) {
      errors[field] = 'Please don’t enter PNR, ticket or passport numbers — ORBIT doesn’t need them.'
    }
  }
  if (!REPORT_OPTIONS.includes(Number(trip.reportBefore))) errors.reportBefore = 'Choose how early you need to be back.'
  return errors
}

const toHHMM = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

/** Works out the free window before an upcoming departure. */
export function tripWindow(trip, now = new Date()) {
  if (!trip) return null
  const until = minutesUntil(trip.departure, now)
  if (!until) return null
  const reportBefore = Number(trip.reportBefore) || 0
  const reportAt = new Date(until.target.getTime() - reportBefore * 60000)
  const available = until.minutes - reportBefore
  // A departure that rolled over by more than 12h almost certainly already left today
  const departed = until.rolled && until.minutes > 12 * 60
  let status = 'ok'
  if (departed) status = 'departed'
  else if (available < MIN_ADVENTURE_MINUTES) status = 'too-close'
  return {
    departureAt: until.target,
    reportAt,
    reportAtHHMM: toHHMM(reportAt),
    untilDeparture: until.minutes,
    available: Math.max(0, available),
    tomorrow: until.rolled && !departed,
    status,
  }
}

/** Preferences for "find adventures in my trip window" — keeps budget, interests, moods and buffer. */
export function tripToPreferences(trip, prefs, now = new Date()) {
  const w = tripWindow(trip, now)
  if (!w || w.status !== 'ok') return null
  return {
    ...prefs,
    durationOption: 'custom',
    customDuration: String(Math.min(LIMITS.maxDuration, w.available)),
    deadline: w.reportAtHHMM,
    location: { label: trip.station.trim(), coords: null, source: 'manual' },
  }
}

/** A clearly-labelled sample trip departing ~2 hours from now. */
export function makeSampleTrip(now = new Date()) {
  const dep = new Date(now.getTime() + 125 * 60000)
  dep.setMinutes(Math.round(dep.getMinutes() / 5) * 5, 0, 0)
  return {
    mode: 'train',
    name: 'Sample trip · Rajdhani Express to Mumbai',
    station: 'New Delhi Railway Station',
    departure: toHHMM(dep),
    reportBefore: 15,
    isSample: true,
  }
}
