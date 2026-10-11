// Timezone helpers without external libraries (Intl does the heavy lifting).

export function isValidTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Offset (ms) of `tz` from UTC at the given instant. */
function offsetMs(utcMs, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

/** Converts a wall-clock 'YYYY-MM-DDTHH:MM' in an IANA zone to a UTC epoch (ms). Handles DST edges. */
export function zonedLocalToUtc(local, tz) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local || '')
  if (!m) throw new Error('Invalid local date-time')
  const [, Y, M, D, h, min] = m.map(Number)
  const guess = Date.UTC(Y, M - 1, D, h, min)
  const first = offsetMs(guess, tz)
  let utc = guess - first
  const second = offsetMs(utc, tz)
  if (second !== first) utc = guess - second
  return utc
}

export function formatInZone(utcMs, tz, opts = {}) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  }).format(new Date(utcMs))
}
