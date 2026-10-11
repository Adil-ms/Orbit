import { Heart } from 'lucide-react'
import { motion } from 'motion/react'
import { useOrbitStore } from '../../store/useOrbitStore'
import { cn } from '../../lib/ui'

export default function SaveButton({ id, name, snapshot, variant = 'overlay', className }) {
  const saved = useOrbitStore((s) => s.saved.some((x) => x.id === id))
  const toggleSaved = useOrbitStore((s) => s.toggleSaved)

  const label = saved ? `Remove ${name} from saved` : `Save ${name}`

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => toggleSaved(id, snapshot)}
        aria-pressed={saved}
        aria-label={label}
        className={cn(
          'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold ring-1 transition-colors',
          saved ? 'bg-orange-50 text-orange-700 ring-orange/50' : 'bg-white text-navy ring-navy/12 hover:ring-orange',
          className,
        )}
      >
        <Heart className={cn('size-4', saved && 'fill-orange text-orange')} />
        {saved ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSaved(id, snapshot)
      }}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? 'Saved' : 'Save for later'}
      className={cn(
        'grid size-11 cursor-pointer place-items-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition-colors hover:bg-white',
        className,
      )}
    >
      <Heart className={cn('size-[18px] transition-colors', saved ? 'fill-orange text-orange' : 'text-navy')} />
    </motion.button>
  )
}
