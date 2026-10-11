import { INTEREST_MAP } from '../../data/options'
import { cn } from '../../lib/ui'

export function CategoryBadge({ id, className }) {
  const interest = INTEREST_MAP[id]
  if (!interest) return null
  const Icon = interest.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-navy shadow-sm',
        className,
      )}
    >
      <Icon className="size-3.5 text-sky" />
      {interest.label}
    </span>
  )
}
