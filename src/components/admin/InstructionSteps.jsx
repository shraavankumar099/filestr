import { cx } from '../../lib/cx.js'

/**
 * InstructionSteps — numbered steps for the local packaging workflow.
 * Steps accept arbitrary content so they can embed commands or callouts.
 */
export function InstructionSteps({ steps, className }) {
  return (
    <ol className={cx('space-y-4', className)}>
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            {step.description ? <p className="text-sm text-slate-600">{step.description}</p> : null}
            {step.children}
          </div>
        </li>
      ))}
    </ol>
  )
}
