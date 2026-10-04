import { Check, Download, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui.jsx'
import { copyToClipboard } from '../lib/fileUtils.js'

/**
 * DownloadButton — a plain anchor to the static file with the `download`
 * attribute. The browser fetches /files/<name> from the same origin, exactly as
 * it would fetch an image. No backend, no signed URLs.
 */
export function DownloadButton({ entry, variant = 'primary', size = 'md', className, label = 'Download' }) {
  return (
    <Button
      as="a"
      href={entry.url}
      download={entry.filename}
      variant={variant}
      size={size}
      className={className}
      aria-label={`Download ${entry.title} (${entry.filename})`}
    >
      <Download className="size-4" aria-hidden="true" />
      {label}
    </Button>
  )
}

/** Copies the absolute URL of a file so it can be shared. */
export function CopyLinkButton({ entry, size = 'md', className }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const absolute = new URL(entry.url, window.location.origin).toString()
    const ok = await copyToClipboard(absolute)
    setCopied(ok)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="secondary" size={size} className={className} onClick={handleCopy}>
      {copied ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />}
      {copied ? 'Link copied' : 'Copy link'}
    </Button>
  )
}
