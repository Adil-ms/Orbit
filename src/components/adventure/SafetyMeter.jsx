import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/ui'
import { formatMinutes } from '../../lib/format'

const LEVEL_STYLES = {
  comfortable: 'bg-success-50 text-success-700 ring-success/25',
  balanced: 'bg-sky-50 text-sky-600 ring-sky/25',
  tight: 'bg-orange-50 text-orange-700 ring-orange/40',
  over: 'bg-red-50 text-danger ring-danger/30',
}

export function SafetyBadge({ safety, className }) {
  const Icon = safety.level === 'tight' || safety.level === 'over' ? ShieldAlert : ShieldCheck
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
        LEVEL_STYLES[safety.level],
        className,
      )}
    >
      <Icon className="size-3.5" /> {safety.label}
    </span>
  )
}

/**
 * Return-Time Safety Meter.
 * Visualises: outbound travel · activity · spare · return travel · safety buffer.
 * `safety` comes from describeSafety() so every screen shows the same numbers.
 * `elapsedMinutes` (optional) draws a "now" marker for the live countdown.
 */
export default function SafetyMeter({ safety, variant = 'compact', elapsedMinutes, className, dark = false }) {
  const segments = [
    { key: 'out', label: 'Travel out', mins: safety.outbound, cls: 'bg-sky' },
    { key: 'act', label: 'Activity', mins: safety.activityMinutes, cls: 'bg-orange' },
    { key: 'spare', label: 'Spare', mins: safety.spareMinutes, cls: dark ? 'bg-white/25' : 'bg-navy/15' },
    { key: 'back', label: 'Travel back', mins: safety.returnTravel, cls: 'bg-sky' },
    { key: 'buf', label: 'Safety buffer', mins: safety.buffer, cls: 'bg-success' },
  ].filter((s) => s.mins > 0)
  const total = Math.max(1, safety.windowMinutes, segments.reduce((n, s) => n + s.mins, 0))
  const showNow = Number.isFinite(elapsedMinutes)
  const muted = dark ? 'text-cream/65' : 'text-muted'
  const strong = dark ? 'text-white' : 'text-navy'

  return (
    <div className={className}>
      {variant === 'full' && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className={cn('text-sm font-semibold', strong)}>Return-time safety</p>
          <SafetyBadge safety={safety} />
        </div>
      )}

      <div className="relative">
        <div
          className={cn('flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full', dark ? 'bg-white/10' : 'bg-navy/5')}
          role="img"
          aria-label={`Safety meter: ${segments.map((s) => `${s.label} ${s.mins} minutes`).join(', ')}. ${safety.label}.`}
        >
          {segments.map((s) => (
            <div key={s.key} className={cn('h-full first:rounded-l-full last:rounded-r-full', s.cls)} style={{ width: `${(s.mins / total) * 100}%` }} />
          ))}
        </div>
        {showNow && (
          <div
            className="absolute -top-1.5 h-5.5 w-1 -translate-x-1/2 rounded-full bg-white shadow ring-2 ring-navy transition-[left] duration-1000"
            style={{ left: `${Math.min(100, Math.max(0, (elapsedMinutes / total) * 100))}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      {variant === 'compact' ? (
        <p className={cn('mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs', muted)}>
          <SafetyBadge safety={safety} />
          <span>
            <strong className={strong}>{formatMinutes(safety.usableActivityMinutes)}</strong> usable · {safety.margin} min margin
          </span>
        </p>
      ) : (
        <>
          <ul className={cn('mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs', muted)}>
            {segments.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-full', s.cls)} />
                {s.label} <span className={cn('font-semibold', strong)}>{formatMinutes(s.mins)}</span>
              </li>
            ))}
          </ul>
          <p className={cn('mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed', dark ? 'bg-white/8' : 'bg-cream')}>
            <span className={muted}>
              {safety.windowMinutes} min window − {safety.outbound} out − {safety.returnTravel} back − {safety.buffer} buffer ={' '}
            </span>
            <strong className={strong}>{formatMinutes(safety.usableActivityMinutes)} usable activity time</strong>
            <span className={cn('mt-0.5 block', muted)}>{safety.hint}</span>
          </p>
        </>
      )}
    </div>
  )
}
