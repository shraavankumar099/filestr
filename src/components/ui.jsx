import { cx } from '../lib/cx.js'

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700',
}

const BUTTON_SIZES = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-10 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
}

/**
 * Button — renders a <button> by default; pass `as={Link}` (plus `to`) or
 * `as="a"` (plus `href`) when it needs to navigate.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  as: Tag = 'button',
  type,
  ...props
}) {
  return (
    <Tag
      {...(Tag === 'button' ? { type: type ?? 'button' } : {})}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Badges & labels                                                             */
/* -------------------------------------------------------------------------- */

export function Badge({ tone = 'bg-slate-100 text-slate-700 ring-slate-500/20', className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SectionLabel({ children, className }) {
  return (
    <p className={cx('text-xs font-semibold tracking-wide text-slate-500 uppercase', className)}>
      {children}
    </p>
  )
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cx('rounded-xl border border-slate-200 bg-white', className)} {...props}>
      {children}
    </Tag>
  )
}

/* -------------------------------------------------------------------------- */
/* Form fields                                                                 */
/* -------------------------------------------------------------------------- */

const CONTROL_CLASSES =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

export function Field({ label, hint, error, htmlFor, required, children, className }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}

export function TextInput({ className, invalid = false, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_CLASSES, invalid && 'border-red-400', className)}
      {...props}
    />
  )
}

export function TextArea({ className, invalid = false, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_CLASSES, 'resize-y leading-relaxed', invalid && 'border-red-400', className)}
      {...props}
    />
  )
}

export function Select({ className, invalid = false, children, ...props }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_CLASSES, 'cursor-pointer pr-8', invalid && 'border-red-400', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-2.5 text-sm text-slate-700', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
        {...props}
      />
      <span>{label}</span>
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/* Segmented control (used for grid/list view and admin tabs)                  */
/* -------------------------------------------------------------------------- */

export function SegmentedControl({ options, value, onChange, label, className }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx('inline-flex rounded-lg border border-slate-300 bg-white p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
