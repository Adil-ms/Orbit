import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '../../lib/ui'

/**
 * Accessible modal dialog: focus moves in on open, Tab is trapped, Escape closes,
 * and focus returns to the element that opened it.
 */
export default function Dialog({ open, onClose, title, description, children, className, role = 'dialog' }) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()
  // Keep the latest onClose without re-running the focus effect on every parent render
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const node = ref.current
    const focusables = () => [...node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled)
    requestAnimationFrame(() => (node.querySelector('[data-autofocus]') ?? focusables()[0])?.focus())
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key === 'Tab') {
        const list = focusables()
        if (!list.length) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-navy/55 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={ref}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 12, opacity: 0, transition: { duration: 0.12 } }}
            className={cn('max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7', className)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-2xl font-medium">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose} className="-mt-1 -mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-cream hover:text-navy" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
