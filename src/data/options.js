import {
  Armchair,
  BatteryLow,
  Compass,
  Headphones,
  Sandwich,
  Telescope,
  Zap,
  Camera,
  Coffee,
  Gem,
  Landmark,
  Leaf,
  MapPin,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react'

export const INTERESTS = [
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'cafes', label: 'Cafés', icon: Coffee },
  { id: 'attractions', label: 'Local attractions', icon: MapPin },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'nature', label: 'Nature', icon: Leaf },
  { id: 'culture', label: 'Culture', icon: Landmark },
  { id: 'relaxation', label: 'Relaxation', icon: Armchair },
  { id: 'hidden', label: 'Hidden gems', icon: Gem },
]

export const INTEREST_MAP = Object.fromEntries(INTERESTS.map((i) => [i.id, i]))

// Moods re-rank activities that already fit the time and budget — they never override those limits.
export const MOODS = [
  { id: 'hungry', label: 'Hungry', icon: Sandwich, blurb: 'Food and cafés first' },
  { id: 'tired', label: 'Tired', icon: BatteryLow, blurb: 'Close by, seated, low effort' },
  { id: 'bored', label: 'Bored', icon: Zap, blurb: 'Something lively and visual' },
  { id: 'curious', label: 'Curious', icon: Telescope, blurb: 'History, culture and hidden corners' },
  { id: 'explore', label: 'Want to Explore', icon: Compass, blurb: 'Real places worth the walk' },
  { id: 'quiet', label: 'Need a Quiet Place', icon: Headphones, blurb: 'Calm spots away from crowds' },
]

export const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.id, m]))

export const DURATION_OPTIONS = [15, 30, 45, 60]

export const BUDGET_OPTIONS = [
  { id: 'free', label: 'Free', value: 0 },
  { id: '100', label: 'Under ₹100', value: 100 },
  { id: '300', label: 'Under ₹300', value: 300 },
  { id: '500', label: 'Under ₹500', value: 500 },
]

export const BUFFER_OPTIONS = [5, 10, 15]

export const DEFAULT_PREFERENCES = {
  durationOption: 45,
  customDuration: '',
  budgetOption: '300',
  customBudget: '',
  interests: [],
  moods: [],
  location: { label: '', coords: null, source: 'manual' },
  deadline: '',
  buffer: 10,
  discoveryRadiusKm: 10, // Discover Kerala "Nearby" radius (null = all nearby results)
}

// Sensible bounds for user input
export const LIMITS = {
  minDuration: 10,
  maxDuration: 360,
  maxBudget: 100000,
}
