import Mascot from '../mascot/Mascot'
import { cn } from '../../lib/ui'

/** Empty / end state with Orbi — one consistent pattern across the app. */
export default function EmptyState({ mascot = 'idle', title, text, children, className, as: Heading = 'h1' }) {
  return (
    <div className={cn('mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center', className)}>
      <Mascot state={mascot} size={150} />
      <Heading className="mt-4 text-3xl font-bold sm:text-4xl">{title}</Heading>
      {text && <p className="mt-3 text-lg text-muted">{text}</p>}
      {children && <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>}
    </div>
  )
}
