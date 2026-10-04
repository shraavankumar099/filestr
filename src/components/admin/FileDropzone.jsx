import { useRef, useState } from 'react'
import { FileCheck2, FolderOpen, UploadCloud, X } from 'lucide-react'
import { Button } from '../ui.jsx'
import { formatBytes } from '../../lib/fileUtils.js'
import { cx } from '../../lib/cx.js'

/**
 * FileDropzone — the admin "file selection control".
 *
 * This picks a file from the user's own machine. It does not upload anything:
 * the File object stays in the browser and is later packaged into a ZIP the user
 * saves and commits.
 */
export function FileDropzone({ file, onSelect, onClear, invalid = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(fileList) {
    const picked = fileList?.[0]
    if (picked) onSelect(picked)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
        className={cx(
          'rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging
            ? 'border-blue-500 bg-blue-50'
            : invalid
              ? 'border-red-300 bg-white'
              : 'border-slate-300 bg-slate-50/60',
        )}
      >
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 ring-inset">
          <UploadCloud className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-slate-900">Choose a file to package</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          Drag a file here, or browse. The file is read locally — it is never uploaded anywhere.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            <FolderOpen className="size-4" aria-hidden="true" />
            Browse files
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files)
            // Allow re-selecting the same file after a clear.
            event.target.value = ''
          }}
        />
      </div>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20 ring-inset">
            <FileCheck2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-slate-500">
              {formatBytes(file.size)} · {file.type || 'unknown MIME type'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear selected file">
            <X className="size-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  )
}
