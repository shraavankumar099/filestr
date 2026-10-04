import { CircleAlert, CircleCheck, Info, ShieldAlert, TriangleAlert } from 'lucide-react'
import { cx } from '../lib/cx.js'

const TONES = {
  info: {
    Icon: Info,
    wrapper: 'border-slate-200 bg-slate-50',
    icon: 'text-slate-500',
    title: 'text-slate-900',
  },
  brand: {
    Icon: Info,
    wrapper: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-900',
  },
  success: {
    Icon: CircleCheck,
    wrapper: 'border-emerald-200 bg-emerald-50',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
  },
  warning: {
    Icon: TriangleAlert,
    wrapper: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
  },
  danger: {
    Icon: ShieldAlert,
    wrapper: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-900',
  },
}

const BODY_TONES = {
  info: 'text-slate-600',
  brand: 'text-blue-800',
  success: 'text-emerald-800',
  warning: 'text-amber-800',
  danger: 'text-red-800',
}

/** Callout — a small notice block used for warnings, tips and validation results. */
export function Callout({ tone = 'info', title, icon: IconOverride, className, children }) {
  const config = TONES[tone] ?? TONES.info
  const Icon = IconOverride ?? config.Icon
  return (
    <div className={cx('flex gap-3 rounded-xl border p-4', config.wrapper, className)}>
      <Icon className={cx('mt-0.5 size-4.5 shrink-0', config.icon)} aria-hidden="true" />
      <div className="min-w-0 space-y-1.5 text-sm">
        {title ? <p className={cx('font-semibold', config.title)}>{title}</p> : null}
        {children ? <div className={cx('space-y-2', BODY_TONES[tone])}>{children}</div> : null}
      </div>
    </div>
  )
}

/** Inline bullet list used inside callouts and instruction panels. */
export function CalloutList({ items, tone = 'info' }) {
  return (
    <ul className={cx('list-disc space-y-1 pl-4', BODY_TONES[tone])}>
      {items.filter(Boolean).map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

export { CircleAlert }
