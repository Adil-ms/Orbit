import { useId, useState } from 'react'
import Dialog from '../ui/Dialog'
import Notice from '../ui/Notice'
import { CATEGORY_IDS, CATEGORY_META, IMPORTANCE_META } from '../../data/trips'
import { buttonClass, cn } from '../../lib/ui'

const inputCls =
  'h-12 w-full rounded-xl bg-white px-4 text-[15px] text-navy ring-1 ring-navy/15 focus:ring-2 focus:ring-sky focus:outline-none aria-invalid:ring-2 aria-invalid:ring-danger'

/** Add / edit a checklist item. */
export default function ItemDialog({ open, onClose, onSave, item, defaultCategory }) {
  const ids = { title: useId(), cat: useId(), imp: useId(), note: useId() }
  const [form, setForm] = useState(() => ({
    title: item?.title ?? '',
    category: item?.category ?? defaultCategory ?? 'clothing',
    importance: item?.importance ?? 'normal',
    note: item?.note ?? '',
  }))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Give the item a name.')
    if (/\d{8,}/.test(form.title + form.note)) return setError('Please don’t store document or account numbers here.')
    setSaving(true)
    try {
      await onSave({ ...form, title: form.title.trim(), note: form.note.trim() || null })
      onClose()
    } catch (err) {
      setError(err.fields ? Object.values(err.fields)[0] : err.message)
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={item ? 'Edit item' : 'Add an item'} description={item ? null : 'Add anything else you want to remember.'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor={ids.title} className="text-sm font-bold">
            Item name <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id={ids.title}
            data-autofocus
            value={form.title}
            maxLength={80}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value })
              setError(null)
            }}
            aria-invalid={Boolean(error)}
            placeholder="e.g. Reading glasses"
            className={cn(inputCls, 'mt-1.5')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.cat} className="text-sm font-bold">
              Category
            </label>
            <select id={ids.cat} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={cn(inputCls, 'mt-1.5 cursor-pointer')}>
              {CATEGORY_IDS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ids.imp} className="text-sm font-bold">
              Importance
            </label>
            <select id={ids.imp} value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })} className={cn(inputCls, 'mt-1.5 cursor-pointer')}>
              {Object.entries(IMPORTANCE_META).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor={ids.note} className="text-sm font-bold">
            Note <span className="font-semibold text-muted">(optional)</span>
          </label>
          <textarea
            id={ids.note}
            rows={2}
            maxLength={200}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="mt-1.5 w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-navy/15 focus:ring-2 focus:ring-sky focus:outline-none"
          />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonClass('secondary', 'md')}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonClass('dark', 'md')}>
            {saving ? 'Saving…' : item ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
