const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount) {
  return inr.format(Math.max(0, Math.round(amount)))
}

export function formatCost(amount) {
  // Unknown is not free — never invent a price
  if (amount == null) return 'Price information unavailable'
  return amount <= 0 ? 'Free' : formatINR(amount)
}

export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h} hr ${r} min` : `${h} hr`
}

export function formatDistance(km) {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  return `${km.toFixed(1)} km`
}

export function formatClock(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

// mm:ss or h:mm:ss for countdowns
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(Math.abs(ms) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
