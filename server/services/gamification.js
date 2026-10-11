import { computeReadiness } from './readiness.js'

export const LEVELS = [
  { level: 1, name: 'New Explorer', minXp: 0 },
  // One fully prepared trip (~850 XP) reaches level 3; Global Explorer takes several well-prepared trips
  { level: 2, name: 'Smart Packer', minXp: 150 },
  { level: 3, name: 'Travel Planner', minXp: 500 },
  { level: 4, name: 'Adventure Pro', minXp: 1000 },
  { level: 5, name: 'Boarding Champion', minXp: 1800 },
  { level: 6, name: 'Global Explorer', minXp: 3000 },
]

export const ACHIEVEMENTS = [
  { id: 'first_adventure', name: 'First Adventure', description: 'Create your first trip.' },
  { id: 'document_defender', name: 'Document Defender', description: 'Complete every critical travel-document item on a trip.' },
  { id: 'halfway_hero', name: 'Halfway Hero', description: 'Complete 50% of a trip checklist (8+ items).' },
  { id: 'fully_packed', name: 'Fully Packed', description: 'Complete every item on a trip checklist (8+ items).' },
  { id: 'early_bird', name: 'Early Bird', description: 'Finish a checklist at least 24 hours before departure.' },
  { id: 'organized_traveler', name: 'Organized Traveler', description: 'Complete every category on a trip checklist.' },
  { id: 'frequent_explorer', name: 'Frequent Explorer', description: 'Get 3 different trips at least halfway prepared.' },
]

export function levelFor(xp) {
  let current = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.minXp) current = l
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null
  return {
    ...current,
    xp,
    next,
    progress: next ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100) : 100,
    xpToNext: next ? next.minXp - xp : 0,
  }
}

/** Public scoring rules (shown to users). */
export function publicRules(scoring) {
  return {
    actions: [
      { id: 'trip', label: 'Create a trip', xp: scoring.tripCreated, note: `Up to ${scoring.maxTripCreationAwardsPer30Days} trips per 30 days` },
      { id: 'essential', label: 'Complete an essential document item', xp: scoring.essentialDocumentItem },
      { id: 'regular', label: 'Complete a regular checklist item', xp: scoring.regularItem, note: `Your own items: first ${scoring.maxCustomItemAwardsPerTrip} per trip` },
      { id: 'category', label: 'Complete an entire category', xp: scoring.categoryComplete, note: `Categories with ${scoring.minItemsForCategoryBonus}+ items` },
      { id: 'half', label: 'Reach 50% checklist completion', xp: scoring.halfway, note: `Checklists with ${scoring.minItemsForBonuses}+ items` },
      { id: 'full', label: 'Reach 100% checklist completion', xp: scoring.fullComplete, note: `Checklists with ${scoring.minItemsForBonuses}+ items` },
      { id: 'early', label: 'Finish before the reminder deadline', xp: scoring.earlyBird, note: `${scoring.earlyBirdHoursBeforeDeparture}h before departure` },
    ],
    fairPlay: [
      'Each item earns XP once per trip — unchecking and re-checking never earns more.',
      'Bonuses and badges are awarded once and are calculated on our servers.',
      'Opening pages or receiving notifications never earns XP.',
    ],
    levels: LEVELS,
    achievements: ACHIEVEMENTS,
  }
}

/**
 * Gamification engine. All awards are idempotent: the ledger has UNIQUE(user_id, event_key),
 * so re-running an evaluation can never double-award.
 */
export function createGamification(db, config) {
  const s = config.scoring
  const insertXp = db.prepare(
    'INSERT OR IGNORE INTO xp_ledger (user_id, trip_id, event_key, amount, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const insertAchievement = db.prepare(
    'INSERT OR IGNORE INTO achievements (user_id, achievement_id, trip_id, unlocked_at) VALUES (?, ?, ?, ?)',
  )
  const insertActivity = db.prepare('INSERT INTO activity (user_id, trip_id, type, message, created_at) VALUES (?, ?, ?, ?, ?)')
  const xpTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_ledger WHERE user_id = ?')

  const totalXp = (userId) => xpTotal.get(userId).xp

  function award(userId, tripId, eventKey, amount, reason, events) {
    if (amount <= 0) return false
    const r = insertXp.run(userId, tripId, eventKey, amount, reason, Date.now())
    if (r.changes === 0) return false // already awarded
    events.push({ type: 'xp', amount, reason })
    insertActivity.run(userId, tripId, 'xp', `You earned ${amount} XP — ${reason}.`, Date.now())
    return true
  }

  function unlock(userId, tripId, id, events) {
    const r = insertAchievement.run(userId, id, tripId, Date.now())
    if (r.changes === 0) return
    const def = ACHIEVEMENTS.find((a) => a.id === id)
    events.push({ type: 'achievement', id, name: def.name })
    insertActivity.run(userId, tripId, 'achievement', `${def.name} badge unlocked.`, Date.now())
  }

  function itemXp(item) {
    return item.category === 'documents' && (item.importance === 'critical' || item.kind === 'requirement')
      ? s.essentialDocumentItem
      : s.regularItem
  }

  /** Trip-created award, capped per rolling 30 days to stop trip farming. */
  function onTripCreated(userId, tripId, events) {
    const recent = db
      .prepare(`SELECT COUNT(*) AS n FROM xp_ledger WHERE user_id = ? AND event_key LIKE 'trip:%:created' AND created_at > ?`)
      .get(userId, Date.now() - 30 * 86400000).n
    if (recent < s.maxTripCreationAwardsPer30Days) award(userId, tripId, `trip:${tripId}:created`, s.tripCreated, 'trip created', events)
    unlock(userId, tripId, 'first_adventure', events)
  }

  /** Item completion award (once per item, ever). User-created items are capped per trip. */
  function onItemCompleted(userId, trip, item, events) {
    if (!item.applicable) return
    if (item.origin === 'user') {
      const customAwards = db
        .prepare(`SELECT COUNT(*) AS n FROM xp_ledger WHERE user_id = ? AND trip_id = ? AND reason = 'your own item packed'`)
        .get(userId, trip.id).n
      if (customAwards >= s.maxCustomItemAwardsPerTrip) return
      award(userId, trip.id, `item:${item.id}:complete`, s.regularItem, 'your own item packed', events)
      return
    }
    const reason = itemXp(item) === s.essentialDocumentItem ? 'essential document checked' : 'item packed'
    award(userId, trip.id, `item:${item.id}:complete`, itemXp(item), reason, events)
  }

  /** Evaluates trip-level bonuses and achievements from the CURRENT persisted state. */
  function evaluateTrip(userId, trip, items, events, now = Date.now()) {
    const r = computeReadiness(items)
    const bonusEligible = r.total >= s.minItemsForBonuses

    for (const cat of r.byCategory) {
      if (cat.total >= s.minItemsForCategoryBonus && cat.completed === cat.total) {
        award(userId, trip.id, `trip:${trip.id}:category:${cat.id}`, s.categoryComplete, `${cat.id} category complete`, events)
      }
    }
    if (bonusEligible && r.completionPct >= 50) {
      if (award(userId, trip.id, `trip:${trip.id}:half`, s.halfway, 'checklist 50% complete', events)) {
        insertActivity.run(userId, trip.id, 'milestone', `${trip.name || trip.destinationCity} checklist reached 50%.`, now)
      }
      unlock(userId, trip.id, 'halfway_hero', events)
    }
    if (bonusEligible && r.completionPct === 100) {
      award(userId, trip.id, `trip:${trip.id}:full`, s.fullComplete, 'checklist 100% complete', events)
      unlock(userId, trip.id, 'fully_packed', events)
      if (now <= trip.departureAt - s.earlyBirdHoursBeforeDeparture * 3600000) {
        award(userId, trip.id, `trip:${trip.id}:early`, s.earlyBird, 'finished early', events)
        unlock(userId, trip.id, 'early_bird', events)
      }
    }

    const docCritical = items.filter((i) => i.applicable && i.category === 'documents' && i.importance === 'critical')
    if (docCritical.length > 0 && docCritical.every((i) => i.completed)) unlock(userId, trip.id, 'document_defender', events)

    const nonEmpty = r.byCategory.filter((c) => c.total > 0)
    if (bonusEligible && nonEmpty.length > 0 && nonEmpty.every((c) => c.completed === c.total)) {
      unlock(userId, trip.id, 'organized_traveler', events)
    }

    if (bonusEligible && r.completionPct >= 50) {
      const halfwayTrips = db
        .prepare(`SELECT COUNT(DISTINCT trip_id) AS n FROM xp_ledger WHERE user_id = ? AND event_key LIKE 'trip:%:half'`)
        .get(userId).n
      if (halfwayTrips >= 3) unlock(userId, trip.id, 'frequent_explorer', events)
    }
    return r
  }

  /** Wraps a mutation: records level before/after and appends a levelup event if the level changed. */
  function withLevelTracking(userId, fn) {
    const before = levelFor(totalXp(userId))
    const events = []
    const result = fn(events)
    const after = levelFor(totalXp(userId))
    if (after.level > before.level) {
      events.push({ type: 'levelup', from: before.level, to: after.level, name: after.name })
      insertActivity.run(userId, null, 'levelup', `Level up! You’ve reached ${after.name}.`, Date.now())
    }
    return { result, events, level: after }
  }

  function summary(userId) {
    const level = levelFor(totalXp(userId))
    const unlocked = db.prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?').all(userId)
    const map = Object.fromEntries(unlocked.map((u) => [u.achievement_id, u.unlocked_at]))
    return {
      level,
      achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: Boolean(map[a.id]), unlockedAt: map[a.id] ?? null })),
    }
  }

  return { onTripCreated, onItemCompleted, evaluateTrip, withLevelTracking, summary, totalXp, itemXp }
}
