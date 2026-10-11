import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/ui'

const tones = {
  info: { cls: 'bg-sky-50 text-navy ring-sky/25', icon: Info, iconCls: 'text-sky' },
  warning: { cls: 'bg-orange-50 text-navy ring-orange/40', icon: TriangleAlert, iconCls: 'text-orange-700' },
  error: { cls: 'bg-red-50 text-red-900 ring-danger/30', icon: TriangleAlert, iconCls: 'text-danger' },
  success: { cls: 'bg-success-50 text-navy ring-success/30', icon: CircleCheck, iconCls: 'text-success-700' },
}

export default function Notice({ tone = 'info', children, className, role }) {
  const t = tones[tone]
  const Icon = t.icon
  return (
    <div
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn('flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ring-1', t.cls, className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', t.iconCls)} />
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}
