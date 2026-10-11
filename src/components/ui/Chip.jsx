import { Check } from 'lucide-react'
import { cn } from '../../lib/ui'

/** Selectable pill. `multi` chips show a check mark and use aria-pressed; single ones act as radios. */
export default function Chip({ selected, onClick, children, icon: Icon, multi = false, size = 'md', className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={multi ? undefined : 'radio'}
      aria-checked={multi ? undefined : selected}
      aria-pressed={multi ? selected : undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold ring-1 transition-all duration-150 select-none',
        size === 'sm' ? 'h-11 px-3.5 text-sm sm:h-9' : 'h-11 px-4 text-[15px]',
        selected
          ? 'bg-navy text-white ring-navy shadow-[0_6px_16px_-8px_rgb(16_36_58/0.7)]'
          : 'bg-white text-navy ring-navy/12 hover:ring-sky hover:text-sky-600',
        className,
      )}
    >
      {multi && selected ? (
        <Check className="size-4 text-orange" strokeWidth={3} />
      ) : (
        Icon && <Icon className={cn('size-4', selected ? 'text-orange' : 'text-sky')} />
      )}
      {children}
    </button>
  )
}
