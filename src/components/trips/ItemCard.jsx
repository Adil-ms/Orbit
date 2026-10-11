import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, BadgeCheck, Ban, ExternalLink, MoreHorizontal, Pencil, RotateCcw, ShieldQuestion, Sparkles, Trash2 } from 'lucide-react'
import { IMPORTANCE_META } from '../../data/trips'
import { cn } from '../../lib/ui'

export function ImportanceBadge({ importance }) {
  const m = IMPORTANCE_META[importance]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1', m.cls)}>
      <m.icon className="size-3" aria-hidden="true" /> {m.label}
    </span>
  )
}

/**
 * Animated checkbox: a real <button role="checkbox"> so it works with keyboard and screen readers.
 * ~220ms micro-interactions: a small spring pulse, colour fade and the tick drawing in (reversed on uncheck).
 * Reduced motion is honoured globally via <MotionConfig reducedMotion="user"> and the CSS override.
 */
function CheckButton({ checked, onToggle, label, busy }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      // aria-disabled (not disabled) keeps keyboard focus on the checkbox while the save is in flight
      onClick={busy ? undefined : onToggle}
      aria-disabled={busy || undefined}
      initial={false}
      animate={{ scale: checked ? [1, 1.12, 1] : [1, 0.92, 1] }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'grid size-11 shrink-0 cursor-pointer place-items-center rounded-2xl ring-2 transition-[background-color,box-shadow] duration-200 aria-disabled:cursor-progress',
        checked ? 'bg-success-700 ring-success-700' : 'bg-white ring-navy/20 hover:ring-sky',
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="#fff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: checked ? 0.22 : 0.15, ease: 'easeOut' }}
        />
      </svg>
    </motion.button>
  )
}

export default function ItemCard({ item, busy, onToggle, onEdit, onRemove, onMove, onApplicable, onVerify, canMoveUp, canMoveDown, readOnlyDetails }) {
  const [menu, setMenu] = useState(false)
  const done = item.completed
  const requirement = item.kind === 'requirement'

  return (
    <motion.li
      layout="position"
      className={cn(
        'relative rounded-2xl p-3 ring-1 transition-[background-color,box-shadow] duration-200 sm:p-4',
        done ? 'bg-success-50/60 ring-success/40' : 'bg-white ring-navy/8',
      )}
    >
      <div className="flex items-start gap-3">
        <CheckButton checked={done} busy={busy} onToggle={onToggle} label={`${item.title}${done ? ' — done' : ''}`} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                // line-through is always present and only its colour animates → no layout shift
                'font-display text-[17px] font-semibold line-through transition-[color,text-decoration-color] duration-200',
                done ? 'text-muted decoration-navy/40' : 'text-navy decoration-transparent',
              )}
            >
              {item.title}
            </h3>
            <ImportanceBadge importance={item.importance} />
            {item.origin === 'ai' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-600">
                <Sparkles className="size-3" aria-hidden="true" /> AI suggestion
              </span>
            )}
            {item.origin === 'user' && <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-bold text-muted">Your item</span>}
          </div>
          {item.note && <p className="mt-1 text-sm leading-relaxed text-muted">{item.note}</p>}

          {requirement && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {item.requirementStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">
                  <BadgeCheck className="size-3.5" /> You confirmed this{item.verifiedAt ? ` on ${new Date(item.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                  <ShieldQuestion className="size-3.5" /> Needs confirmation
                </span>
              )}
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-sky-600 underline-offset-2 hover:underline sm:min-h-9"
                >
                  {item.sourceLabel ?? 'Official source'} <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
              {item.sourceAddedOn && <span className="text-xs text-muted">Link added {item.sourceAddedOn} · not verified by ORBIT</span>}
              {!readOnlyDetails && (
                <button
                  type="button"
                  onClick={onVerify}
                  disabled={busy}
                  aria-pressed={item.requirementStatus === 'verified'}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 text-sm font-bold text-navy ring-1 ring-navy/15 hover:ring-sky sm:min-h-9"
                >
                  {item.requirementStatus === 'verified' ? 'Mark as unconfirmed' : 'I’ve checked the official source'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-haspopup="menu"
              aria-label={`More actions for ${item.title}`}
              className="grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-cream hover:text-navy"
            >
              <MoreHorizontal className="size-5" />
            </button>
            {menu && (
              <>
                <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
                <ul
                  role="menu"
                  aria-label={`Actions for ${item.title}`}
                  className="absolute top-12 right-0 z-20 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-navy/10"
                  onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}
                >
                  {[
                    { icon: Pencil, label: 'Edit item', run: onEdit },
                    canMoveUp && { icon: ArrowUp, label: 'Move up', run: () => onMove(-1) },
                    canMoveDown && { icon: ArrowDown, label: 'Move down', run: () => onMove(1) },
                    { icon: Ban, label: 'Not needed for this trip', run: () => onApplicable(false) },
                    { icon: Trash2, label: 'Remove item', run: onRemove, danger: true },
                  ]
                    .filter(Boolean)
                    .map((a, i) => (
                      <li key={a.label} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          autoFocus={i === 0}
                          onClick={() => {
                            setMenu(false)
                            a.run()
                          }}
                          className={cn(
                            'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-[15px] font-semibold hover:bg-cream',
                            a.danger ? 'text-danger' : 'text-navy',
                          )}
                        >
                          <a.icon className="size-4" aria-hidden="true" /> {a.label}
                        </button>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  )
}

/** Compact row for items marked "not needed" — can be switched back on. */
export function NotNeededItem({ item, onRestore, busy }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3 py-2">
      <span className="min-w-0">
        <span className="block truncate font-semibold text-muted line-through decoration-navy/20">{item.title}</span>
        {item.applicabilityNote && <span className="block text-xs text-muted">{item.applicabilityNote}</span>}
      </span>
      <button type="button" disabled={busy} onClick={onRestore} className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-bold text-sky-600 hover:bg-white">
        <RotateCcw className="size-4" /> Needed
      </button>
    </li>
  )
}
