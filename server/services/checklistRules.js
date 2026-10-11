import { officialEntrySource } from '../data/officialSources.js'

export const CATEGORIES = ['documents', 'tickets', 'health', 'money', 'electronics', 'clothing', 'destination']
export const IMPORTANCE = ['critical', 'high', 'normal', 'optional']
export const PURPOSES = ['tourism', 'business', 'study', 'work', 'medical', 'other']

const CHECK_NOTE =''

/**
 * Deterministic baseline checklist. Entry requirements are never asserted — they are
 * created as "requirement" items in an unverified state, with an official link when we have one.
 */
export function buildRuleChecklist({ destinationCountry, purpose }) {
  const items = []
  const add = (category, title, importance, extra = {}) =>
    items.push({ category, title, importance, kind: 'item', applicable: true, note: null, ...extra })

  const source = officialEntrySource(destinationCountry)
  const requirement = (extra = {}) => ({
    kind: 'requirement',
    requirementStatus: 'unverified',
    sourceUrl: source?.url ?? null,
    sourceLabel: source?.label ?? null,
    sourceAddedOn: source?.addedOn ?? null,
    ...extra,
  })

  // ── 1. Travel documents ──────────────────────────────────────────────────
  add('documents', 'Passport', 'critical', {
    ...requirement(),
    note: 'Many countries require your passport to stay valid for a period after you arrive (often 6 months). Mark it “not needed” for a domestic trip.',
  })
  add('documents', 'Visa or entry authorisation — check if you need one', 'critical', {
    ...requirement(),
    note: CHECK_NOTE,
  })
  add('documents', 'Second photo ID', 'normal')
  add('documents', 'Travel insurance documents', 'high', {
    note: 'Keep a digital and a printed copy.',
  })
  if (purpose === 'business') {
    add('documents', 'Business invitation or letter — check if required', 'high', { ...requirement(), note: CHECK_NOTE })
  } else if (purpose === 'study') {
    add('documents', 'Admission letter and student documents', 'critical', { ...requirement(), note: CHECK_NOTE })
  } else if (purpose === 'work') {
    add('documents', 'Work permit or employment documents — check what applies', 'critical', { ...requirement(), note: CHECK_NOTE })
  } else if (purpose === 'medical') {
    add('documents', 'Hospital appointment confirmation', 'high')
  }
  add('documents', 'Copies of key documents (stored separately)', 'normal')

  // ── 2. Tickets & bookings ────────────────────────────────────────────────
  add('tickets', 'Flight / train ticket or boarding pass', 'critical')
  add('tickets', 'Accommodation confirmation', 'high')
  add('tickets', 'Return or onward ticket', 'high', {
    note: 'Some destinations and airlines ask for proof of onward travel — check with your carrier.',
  })
  add('tickets', 'Route to the airport or station', 'normal')

  // ── 3. Health & medical ─────────────────────────────────────────────────
  add('health', 'Prescribed medication in original packaging', 'high', {
    note: '',
  })
  add('health', 'Health insurance card', 'high')
  add('health', 'Basic first-aid kit', 'normal')
  add('health', 'Vaccination records — check if any are required', 'high', {
    ...requirement({ sourceUrl: null, sourceLabel: null, sourceAddedOn: null }),
    note: '',
  })

  // ── 4. Money & payments ─────────────────────────────────────────────────
  add('money', 'Debit / credit cards', 'critical')
  add('money', 'Tell your bank about your trip', 'normal')
  add('money', 'Some local currency', 'normal')
  add('money', 'Backup card stored separately', 'optional')

  // ── 5. Electronics ──────────────────────────────────────────────────────
  add('electronics', 'Phone and charger', 'high')
  add('electronics', 'Power bank', 'normal', { note: 'Usually carry-on only — check your airline’s rules.' })
  add('electronics', 'Travel plug adapter', 'normal')
  add('electronics', 'Offline copies of tickets and maps', 'normal')
  add('electronics', 'Headphones', 'optional')

  // ── 6. Clothing & personal ──────────────────────────────────────────────
  add('clothing', 'Weather-appropriate clothing', 'normal')
  add('clothing', 'Comfortable walking shoes', 'normal')
  add('clothing', 'Toiletries', 'normal')
  if (purpose === 'business') add('clothing', 'Business attire', 'high')
  add('clothing', 'Sleepwear', 'optional')

  // ── 7. Destination-specific ─────────────────────────────────────────────
  add('destination', 'Check local entry rules and travel advisories', 'high', {
    ...requirement(),
    note: 'Rules change. Check official government sources shortly before you leave.',
  })
  add('destination', 'Emergency contacts and accommodation address', 'normal')
  add('destination', 'Mobile data plan, local SIM or eSIM', 'normal')

  return items
}
