import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyToClipboard } from '../lib/fileUtils.js'
import { cx } from '../lib/cx.js'

/** CodeBlock — monospaced block with a copy button; used for shell commands and JSON. */
export function CodeBlock({ code, title, className, tone = 'dark' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyToClipboard(code)
    setCopied(ok)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cx('overflow-hidden rounded-lg border', tone === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50', className)}>
      <div
        className={cx(
          'flex items-center justify-between gap-2 border-b px-3 py-1.5',
          tone === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
        )}
      >
        <span className={cx('font-mono text-[11px]', tone === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
          {title ?? 'shell'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cx(
            'inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium transition-colors',
            tone === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100',
          )}
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className={cx(
          'overflow-x-auto p-3 font-mono text-xs leading-relaxed',
          tone === 'dark' ? 'text-slate-100' : 'text-slate-800',
        )}
      >
        {code}
      </pre>
    </div>
  )
}
