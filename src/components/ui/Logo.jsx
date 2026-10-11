import { cn } from '../../lib/ui'

export function OrbitMark({ className = 'size-9', light = false }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="7.5"
        fill="none"
        stroke={light ? '#F4F4F4' : '#C9441F'}
        strokeWidth="2.6"
        transform="rotate(-28 20 20)"
      />
      <circle cx="20" cy="20" r="7" fill={light ? '#F4F4F4' : '#141414'} />
      <circle cx="33.6" cy="12.6" r="3.6" fill="#C9441F" />
    </svg>
  )
}

export default function Logo({ light = false, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <OrbitMark light={light} />
      <span
        className={cn(
          'font-display text-2xl font-medium tracking-[0.14em]',
          light ? 'text-cream' : 'text-navy',
        )}
      >
        ORBIT
      </span>
    </span>
  )
}
