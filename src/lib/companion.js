/**
 * Picks Orbi's state + message from the REAL checklist state. Messages never claim more than the data says:
 * a 100% checklist with unconfirmed entry requirements is "packed", not "ready".
 */
export function companionFor({ readiness, lastEvent, items } = {}) {
  if (!readiness) return { state: 'idle', message: 'Ready for your next adventure?' }
  if (readiness.total === 0) return { state: 'idle', message: 'Add a few items and I’ll keep track of them for you.' }

  const unconfirmed = readiness.requirements?.status === 'needs_confirmation' ? readiness.requirements.total - readiness.requirements.verified : 0

  if (readiness.completionPct === 100) {
    if (unconfirmed > 0) {
      return {
        state: 'reminder',
        message: `All packed! Just confirm ${unconfirmed} entry requirement${unconfirmed === 1 ? '' : 's'} with official sources.`,
      }
    }
    return { state: 'ready', message: 'All checked! Your adventure awaits!' }
  }

  if (lastEvent?.type === 'item') {
    return lastEvent.important
      ? { state: 'success', message: 'Amazing! You packed another essential!' }
      : { state: 'success', message: 'Nice — one more thing sorted!' }
  }

  if (readiness.completionPct >= 75) return { state: 'idle', message: 'You’re almost ready to take off!' }

  const critical = readiness.criticalOutstanding?.[0]
  if (critical) {
    const title = items?.find((i) => i.id === critical.id)?.title ?? critical.title
    return { state: 'reminder', message: `Your ${title.toLowerCase().replace(/ —.*$/, '')} still needs a check!` }
  }
  return { state: 'idle', message: 'Let’s make sure you have everything!' }
}
