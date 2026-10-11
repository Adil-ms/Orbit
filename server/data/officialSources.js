// Official government entry-requirement portals, curated by hand.
// These are links to CHECK requirements — ORBIT does not interpret or verify the rules themselves.
// `addedOn` is when the link was added to this list (shown to users), not a verification date.

const ADDED_ON = '2026-10-11'

const SCHENGEN = {
  label: 'European Commission — Schengen visa policy',
  url: 'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en',
}
const SCHENGEN_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT', 'LV', 'LI', 'LT', 'LU',
  'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH',
]

const SOURCES = {
  AE: { label: 'UAE Government portal — visas', url: 'https://u.ae/en/information-and-services/visa-and-emirates-id' },
  GB: { label: 'GOV.UK — Check if you need a UK visa', url: 'https://www.gov.uk/check-uk-visa' },
  US: { label: 'U.S. Department of State — U.S. visas', url: 'https://travel.state.gov/content/travel/en/us-visas.html' },
  CA: {
    label: 'Government of Canada — Entry requirements by country',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html',
  },
  AU: { label: 'Australian Department of Home Affairs — Visa finder', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder' },
  SG: { label: 'Singapore ICA — Visa requirements', url: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements' },
  JP: { label: 'Ministry of Foreign Affairs of Japan — Visa', url: 'https://www.mofa.go.jp/j_info/visit/visa/index.html' },
  TH: { label: 'Thailand official e-Visa website', url: 'https://www.thaievisa.go.th' },
  IN: { label: 'Government of India — Indian Visa Online', url: 'https://indianvisaonline.gov.in' },
}

/** Returns { label, url, addedOn } for the destination's official visa portal, or null if we don't have one. */
export function officialEntrySource(countryCode) {
  const code = String(countryCode || '').toUpperCase()
  const source = SOURCES[code] ?? (SCHENGEN_COUNTRIES.includes(code) ? SCHENGEN : null)
  return source ? { ...source, addedOn: ADDED_ON } : null
}
