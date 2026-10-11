import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sanitize } from '../services/ai.js'
import { renderNotification } from '../services/messages.js'
import { computeReadiness } from '../services/readiness.js'
import { levelFor } from '../services/gamification.js'
import { zonedLocalToUtc } from '../lib/time.js'

test('AI output is sanitised: links stripped, duplicates dropped, requirements never verified', () => {
  const out = sanitize(
    [
      { category: 'documents', title: 'Passport', note: 'dup', importance: 'critical', is_entry_requirement: true },
      { category: 'destination', title: 'Check tourist permit https://evil.example', note: 'see https://x.y', importance: 'high', is_entry_requirement: true },
      { category: 'clothing', title: 'Light rain jacket', note: 'Showers are common', importance: 'normal', is_entry_requirement: false },
    ],
    ['Passport'],
  )
  assert.equal(out.length, 2)
  assert.ok(!JSON.stringify(out).includes('http'))
  assert.equal(out[0].kind, 'requirement')
  assert.equal(out[0].requirementStatus, 'unverified')
  assert.match(out[0].note, /confirm with an official source/)
  assert.equal(out[1].kind, 'item')
})

test('notification text: departure time and progress, never checklist item titles', () => {
  const trip = { destinationCity: 'Dubai', departureAt: Date.UTC(2026, 11, 1, 10), departureTz: 'Asia/Dubai' }
  const reminder = renderNotification('reminder', { trip, readiness: { score: 75, completed: 1, total: 4 } })
  assert.match(reminder.title, /^Your trip to Dubai departs /)
  assert.match(reminder.title, /14:00/) // 10:00 UTC shown in the trip's own time zone
  assert.equal(reminder.body, '3 items still to check · 75% prepared')
  assert.equal(renderNotification('reminder', { trip, readiness: { score: 100, completed: 4, total: 4 } }).body, 'Everything on your checklist is checked!')
  const update = renderNotification('update', { trip, readiness: { score: 50, completed: 2, total: 4 } })
  assert.deepEqual(update, { title: 'Checklist updated · Dubai', body: '2 of 4 items checked' })
})

test('readiness weighting and requirement status', () => {
  const base = { kind: 'item', applicable: true, completed: false, category: 'documents' }
  const items = [
    { ...base, id: 'a', importance: 'critical', completed: true },
    { ...base, id: 'b', importance: 'optional' },
    { ...base, id: 'c', importance: 'normal', applicable: false },
    { ...base, id: 'd', importance: 'high', kind: 'requirement', requirementStatus: 'unverified' },
  ]
  const r = computeReadiness(items)
  assert.equal(r.score, Math.round((5 / (5 + 1 + 3)) * 100))
  assert.equal(r.total, 3)
  assert.equal(r.notApplicable, 1)
  assert.equal(r.requirements.status, 'needs_confirmation')
  assert.equal(computeReadiness([]).requirements.status, 'none')
})

test('levels', () => {
  assert.equal(levelFor(0).name, 'New Explorer')
  assert.equal(levelFor(149).level, 1)
  assert.equal(levelFor(150).level, 2)
  assert.equal(levelFor(499).xpToNext, 1)
  assert.equal(levelFor(5000).level, 6)
  assert.equal(levelFor(5000).next, null)
})

test('timezone conversion including DST', () => {
  assert.equal(zonedLocalToUtc('2026-12-01T10:00', 'Asia/Kolkata'), Date.UTC(2026, 11, 1, 4, 30))
  assert.equal(zonedLocalToUtc('2026-07-01T10:00', 'America/New_York'), Date.UTC(2026, 6, 1, 14, 0))
  assert.equal(zonedLocalToUtc('2026-01-15T10:00', 'America/New_York'), Date.UTC(2026, 0, 15, 15, 0))
})
