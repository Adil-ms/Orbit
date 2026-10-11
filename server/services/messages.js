import { formatInZone } from '../lib/time.js'

/**
 * Notification-bar text for a trip reminder or checklist update.
 * Never includes checklist item titles: they can reveal health or personal details on a lock screen.
 */
export function renderNotification(kind, { trip, readiness }) {
  const remaining = readiness.total - readiness.completed
  if (kind === 'reminder') {
    return {
      title: `Your trip to ${trip.destinationCity} departs ${formatInZone(trip.departureAt, trip.departureTz)}`,
      body: remaining > 0 ? `${remaining} item${remaining === 1 ? '' : 's'} still to check · ${readiness.score}% prepared` : 'Everything on your checklist is checked!',
    }
  }
  return { title: `Checklist updated · ${trip.destinationCity}`, body: `${readiness.completed} of ${readiness.total} items checked` }
}
