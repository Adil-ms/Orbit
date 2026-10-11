import { motion } from 'motion/react'
import { cn } from '../../lib/ui'

/** Animated circular readiness indicator (0–100). Exposed to assistive tech as a meter. */
export function ReadinessRing({ score = 0, size = 132, stroke = 12, label = 'Readiness', dark = false, className }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, score))
  const color = clamped >= 100 ? '#047857' : clamped >= 50 ? '#E8603C' : '#C9441F'
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgb(255 255 255 / 0.12)' : '#EAEAEA'} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-display text-3xl font-bold tabular-nums', dark ? 'text-white' : 'text-navy')} style={{ fontSize: size / 4.4 }}>
          {clamped}
        </span>
        <span className={cn('text-xs font-bold tracking-wide uppercase', dark ? 'text-cream/75' : 'text-muted')}>{label}</span>
      </div>
    </div>
  )
}
