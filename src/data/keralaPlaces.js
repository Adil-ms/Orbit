// ─────────────────────────────────────────────────────────────────────────────
// Curated Kerala destinations (ORBIT editorial list).
// Coordinates are APPROXIMATE, entered by hand from general knowledge — they are
// NOT verified survey data. Shown to users as "approximate". Verify before relying on them.
// No prices, opening hours or fees are stored: that information is unavailable here.
// Add entries freely — UI components read this list generically.
// ─────────────────────────────────────────────────────────────────────────────

export const KERALA_SOURCE = { label: 'ORBIT curated list', kind: 'curated', coordsPrecision: 'approximate' }

/** Selectable cities / districts (manual starting points). */
export const KERALA_DISTRICTS = [
  { id: 'kozhikode', name: 'Kozhikode', coords: [11.2588, 75.7804] },
  { id: 'kannur', name: 'Kannur', coords: [11.8745, 75.3704] },
  { id: 'wayanad', name: 'Wayanad (Kalpetta)', coords: [11.6085, 76.083] },
  { id: 'kochi', name: 'Kochi', coords: [9.9312, 76.2673] },
  { id: 'thrissur', name: 'Thrissur', coords: [10.5276, 76.2144] },
  { id: 'alappuzha', name: 'Alappuzha', coords: [9.4981, 76.3388] },
  { id: 'munnar', name: 'Munnar', coords: [10.0889, 77.0595] },
  { id: 'varkala', name: 'Varkala', coords: [8.7379, 76.7163] },
  { id: 'thekkady', name: 'Thekkady', coords: [9.6031, 77.1615] },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', coords: [8.5241, 76.9366] },
]

// groups: beaches | nature | culture | food | hidden | weekend
const P = (id, name, district, coords, category, interests, groups, description, visit) => ({
  id: `kl-${id}`,
  name,
  district,
  coords,
  category,
  interests,
  groups,
  description,
  visitMinutes: visit, // typical visit, ORBIT estimate
  source: KERALA_SOURCE,
  live: false,
})

export const KERALA_PLACES = [
  // Kozhikode
  P('kozhikode-beach', 'Kozhikode Beach', 'Kozhikode', [11.2585, 75.7712], 'nature', ['nature', 'relaxation', 'photography'], ['beaches'], 'The city’s seafront promenade, popular for evening walks and sunsets.', { min: 30, max: 90 }),
  P('sm-street', 'SM Street (Mittayi Theruvu)', 'Kozhikode', [11.2527, 75.7808], 'shopping', ['shopping', 'food', 'culture'], ['food'], 'Historic shopping street known for halwa shops and busy market lanes.', { min: 20, max: 60 }),
  P('mananchira', 'Mananchira Square', 'Kozhikode', [11.2518, 75.7826], 'relaxation', ['relaxation', 'nature', 'culture'], ['culture'], 'A landscaped square around a historic pond in the city centre.', { min: 20, max: 45 }),
  P('beypore-beach', 'Beypore Beach', 'Kozhikode', [11.1706, 75.8048], 'nature', ['nature', 'photography', 'hidden'], ['beaches', 'hidden'], 'A beach with a long breakwater near the old boat-building harbour.', { min: 30, max: 90 }),
  P('kappad-beach', 'Kappad Beach', 'Kozhikode', [11.3836, 75.7189], 'nature', ['nature', 'relaxation', 'culture'], ['beaches'], 'A rocky-edged beach north of the city with historical associations.', { min: 30, max: 90 }),
  P('sarovaram', 'Sarovaram Biopark', 'Kozhikode', [11.2744, 75.791], 'nature', ['nature', 'relaxation'], ['nature'], 'A wetland park with walkways near the Canoly Canal.', { min: 30, max: 75 }),
  // Kannur
  P('payyambalam', 'Payyambalam Beach', 'Kannur', [11.884, 75.364], 'nature', ['nature', 'relaxation'], ['beaches'], 'A long beach close to Kannur town.', { min: 30, max: 90 }),
  P('st-angelo', 'St. Angelo Fort', 'Kannur', [11.8564, 75.3664], 'culture', ['culture', 'attractions', 'photography'], ['culture'], 'A sea-facing fort built in the early 16th century.', { min: 30, max: 75 }),
  P('muzhappilangad', 'Muzhappilangad Drive-in Beach', 'Kannur', [11.795, 75.447], 'nature', ['nature', 'attractions'], ['beaches', 'weekend'], 'A long beach known for allowing vehicles on the sand.', { min: 30, max: 90 }),
  P('arakkal', 'Arakkal Museum', 'Kannur', [11.863, 75.368], 'culture', ['culture', 'hidden'], ['culture', 'hidden'], 'A museum in a palace associated with the Arakkal royal family.', { min: 30, max: 60 }),
  // Wayanad
  P('pookode', 'Pookode Lake', 'Wayanad', [11.542, 76.027], 'nature', ['nature', 'relaxation'], ['nature'], 'A forest-fringed freshwater lake.', { min: 45, max: 120 }),
  P('edakkal', 'Edakkal Caves', 'Wayanad', [11.624, 76.236], 'culture', ['culture', 'hidden', 'nature'], ['culture', 'weekend'], 'Natural rock shelters with ancient petroglyphs, reached by a hill climb.', { min: 90, max: 180 }),
  P('banasura', 'Banasura Sagar Dam', 'Wayanad', [11.672, 75.956], 'nature', ['nature', 'photography'], ['nature', 'weekend'], 'A large earthen dam and reservoir with island views.', { min: 60, max: 150 }),
  // Kochi
  P('fort-kochi', 'Fort Kochi', 'Kochi', [9.965, 76.242], 'culture', ['culture', 'photography', 'cafes'], ['culture', 'food'], 'Historic quarter with colonial streets and Chinese fishing nets.', { min: 60, max: 180 }),
  P('marine-drive-kochi', 'Marine Drive', 'Kochi', [9.979, 76.277], 'relaxation', ['relaxation', 'photography'], ['nature'], 'A waterfront walkway facing the backwaters.', { min: 20, max: 60 }),
  P('mattancherry', 'Mattancherry Palace', 'Kochi', [9.958, 76.259], 'culture', ['culture', 'attractions'], ['culture'], 'A palace museum known for its murals.', { min: 30, max: 75 }),
  P('cherai', 'Cherai Beach', 'Kochi', [10.142, 76.178], 'nature', ['nature', 'relaxation'], ['beaches'], 'A beach on Vypin island with backwaters close by.', { min: 45, max: 120 }),
  // Elsewhere
  P('athirappilly', 'Athirappilly Waterfalls', 'Thrissur', [10.285, 76.569], 'nature', ['nature', 'photography'], ['nature', 'weekend'], 'One of Kerala’s best-known waterfalls.', { min: 60, max: 180 }),
  P('varkala-cliff', 'Varkala Cliff', 'Varkala', [8.734, 76.703], 'nature', ['nature', 'cafes', 'photography'], ['beaches', 'food'], 'Clifftop walkway above the beach, lined with cafés.', { min: 60, max: 180 }),
  P('alappuzha-beach', 'Alappuzha Beach', 'Alappuzha', [9.493, 76.317], 'nature', ['nature', 'relaxation'], ['beaches'], 'Town beach with an old pier.', { min: 30, max: 90 }),
  P('alappuzha-backwaters', 'Alappuzha Backwaters', 'Alappuzha', [9.5, 76.34], 'nature', ['nature', 'relaxation', 'photography'], ['nature', 'weekend'], 'Network of canals and lakes known for houseboat trips.', { min: 120, max: 480 }),
  P('munnar', 'Munnar', 'Munnar', [10.0889, 77.0595], 'nature', ['nature', 'photography'], ['nature', 'weekend'], 'Hill station surrounded by tea estates.', { min: 240, max: 720 }),
  P('thekkady', 'Periyar / Thekkady', 'Thekkady', [9.6031, 77.1615], 'nature', ['nature', 'hidden'], ['nature', 'weekend'], 'Forest region around the Periyar reserve.', { min: 180, max: 600 }),
]

export const EXPLORE_GROUPS = [
  { id: 'beaches', label: 'Beaches' },
  { id: 'nature', label: 'Nature & waterfalls' },
  { id: 'culture', label: 'Culture & heritage' },
  { id: 'food', label: 'Food & markets' },
  { id: 'hidden', label: 'Hidden gems' },
  { id: 'weekend', label: 'Weekend destinations' },
]

export const getKeralaPlace = (id) => KERALA_PLACES.find((p) => p.id === id) ?? null
