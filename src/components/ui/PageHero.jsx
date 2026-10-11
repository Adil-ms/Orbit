import Mascot from '../mascot/Mascot'
import { cn } from '../../lib/ui'

/**
 * Shared page header (design-system/orbit/MASTER.md): light hero surface, display heading,
 * optional Orbi as the single animated focal element, and a slot for actions.
 */
export default function PageHero({ eyebrow, title, description, mascot, children, className, titleProps }) {
  return (
    <section className={cn('hero-surface overflow-hidden rounded-[2rem] px-6 py-8 text-navy sm:px-10 sm:py-10', className)}>
      <div className={cn('grid items-center gap-6', mascot && 'md:grid-cols-[1fr_auto]')}>
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-bold tracking-wide text-orange-700 uppercase">{eyebrow}</p>}
          <h1 className="mt-1 text-4xl font-medium sm:text-5xl" {...titleProps}>
            {title}
          </h1>
          {description && <p className="mt-3 max-w-2xl text-lg text-muted">{description}</p>}
          {children && <div className="mt-5">{children}</div>}
        </div>
        {mascot && <Mascot state={mascot.state} message={mascot.message} size={mascot.size ?? 130} tone="light" bubble={mascot.bubble ?? 'left'} className="hidden md:flex" />}
      </div>
    </section>
  )
}
