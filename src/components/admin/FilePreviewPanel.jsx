import { useEffect, useState } from 'react'
import { Eye, FileQuestion } from 'lucide-react'
import { Badge, Card, SectionLabel } from '../ui.jsx'
import { getFileTypeMeta } from '../../lib/constants.js'
import { formatBytes } from '../../lib/fileUtils.js'
import { useObjectUrl } from '../../hooks/useObjectUrl.js'

const TEXT_PREVIEW_LIMIT = 1500

/** Reads the first chunk of a text-like file for an inline preview. */
function useTextPreview(file, enabled) {
  const [text, setText] = useState(null)

  useEffect(() => {
    let active = true
    if (!file || !enabled) {
      setText(null)
      return () => {
        active = false
      }
    }
    file
      .text()
      .then((content) => {
        if (active) setText(content.slice(0, TEXT_PREVIEW_LIMIT))
      })
      .catch(() => {
        if (active) setText(null)
      })
    return () => {
      active = false
    }
  }, [file, enabled])

  return text
}

function PreviewBody({ file, meta, objectUrl }) {
  const text = useTextPreview(file, ['text', 'data', 'code'].includes(meta.key))

  if (meta.key === 'image') {
    return (
      <img
        src={objectUrl}
        alt={`Preview of ${file.name}`}
        className="max-h-72 w-full rounded-lg object-contain"
      />
    )
  }
  if (meta.key === 'video') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={objectUrl} controls className="max-h-72 w-full rounded-lg bg-black" />
  }
  if (meta.key === 'audio') {
    return <audio src={objectUrl} controls className="w-full" />
  }
  if (meta.key === 'pdf') {
    return (
      <iframe
        src={objectUrl}
        title={`Preview of ${file.name}`}
        className="h-80 w-full rounded-lg border border-slate-200 bg-white"
      />
    )
  }
  if (text) {
    return (
      <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
        {text}
        {text.length >= TEXT_PREVIEW_LIMIT ? '\n…' : ''}
      </pre>
    )
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <FileQuestion className="size-6 text-slate-400" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-700">No inline preview for this type</p>
      <p className="max-w-sm text-xs text-slate-500">
        {meta.label} files cannot be rendered in the browser. The bytes are still read correctly and will be packaged
        as-is — open them locally after exporting to check the contents.
      </p>
    </div>
  )
}

/**
 * FilePreviewPanel — preview and metadata for the selected file, rendered from
 * the local File object only.
 */
export function FilePreviewPanel({ file, title }) {
  const objectUrl = useObjectUrl(file)
  const meta = getFileTypeMeta(file?.name ?? '')

  if (!file) {
    return (
      <Card className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <Eye className="size-5 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-700">No file selected</p>
        <p className="max-w-xs text-xs text-slate-500">
          Select a file to see a preview, its detected type and its size.
        </p>
      </Card>
    )
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>Preview</SectionLabel>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900" title={file.name}>
            {title?.trim() || file.name}
          </p>
          <p className="truncate font-mono text-xs text-slate-500">{file.name}</p>
        </div>
        <Badge tone={meta.badge}>{meta.label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
        <div>
          <dt className="text-slate-500">Size</dt>
          <dd className="font-medium text-slate-900">{formatBytes(file.size)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Bytes</dt>
          <dd className="font-mono text-slate-900">{file.size.toLocaleString()}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">MIME type reported by the browser</dt>
          <dd className="truncate font-mono text-slate-900">{file.type || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">Last modified</dt>
          <dd className="text-slate-900">{new Date(file.lastModified).toLocaleString()}</dd>
        </div>
      </dl>

      <div>
        <SectionLabel className="mb-2">File contents</SectionLabel>
        <PreviewBody file={file} meta={meta} objectUrl={objectUrl} />
      </div>
    </Card>
  )
}
