import { Link } from 'react-router-dom'
import { Calendar, Eye, Tag } from 'lucide-react'
import { Badge, Card } from './ui.jsx'
import { DownloadButton } from './DownloadButton.jsx'
import { getFileTypeMeta } from '../lib/constants.js'
import { formatBytes, formatDate } from '../lib/fileUtils.js'
import { cx } from '../lib/cx.js'

function TypeIcon({ entry, size = 'md' }) {
  const { Icon, icon, badge } = getFileTypeMeta(entry.fileType || entry.filename)
  const box = size === 'lg' ? 'size-12' : 'size-10'
  const glyph = size === 'lg' ? 'size-6' : 'size-5'
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', box, badge)}
      aria-hidden="true"
    >
      <Icon className={cx(glyph, icon)} />
    </span>
  )
}

function MetaRow({ entry }) {
  const meta = getFileTypeMeta(entry.fileType || entry.filename)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="font-medium text-slate-700">{meta.label}</span>
      <span aria-hidden="true">·</span>
      <span>{formatBytes(entry.size)}</span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Tag className="size-3.5" aria-hidden="true" />
        {entry.category}
      </span>
      {entry.addedAt ? (
        <>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Calendar className="size-3.5" aria-hidden="true" />
            {formatDate(entry.addedAt)}
          </span>
        </>
      ) : null}
    </div>
  )
}

/** Grid card — the default library layout. */
function GridCard({ entry }) {
  const meta = getFileTypeMeta(entry.fileType || entry.filename)
  return (
    <Card className="flex h-full flex-col gap-4 p-5 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <TypeIcon entry={entry} />
        <Badge tone={meta.badge}>
          .{entry.fileType || entry.filename.split('.').pop()}
        </Badge>
      </div>

      <div className="min-w-0 space-y-1">
        <h3 className="text-sm leading-snug font-semibold text-slate-900">
          <Link to={`/file/${entry.id}`} className="hover:text-blue-700 hover:underline">
            {entry.title}
          </Link>
        </h3>
        <p className="truncate font-mono text-xs text-slate-500" title={entry.filename}>
          {entry.filename}
        </p>
      </div>

      {entry.description ? (
        <p className="clamp-2 text-sm text-slate-600">{entry.description}</p>
      ) : (
        <p className="text-sm text-slate-400 italic">No description provided.</p>
      )}

      <div className="mt-auto space-y-3 pt-3">
        <MetaRow entry={entry} />
        <div className="flex items-center gap-2">
          <DownloadButton entry={entry} size="sm" className="h-9 flex-1" />
          <Link
            to={`/file/${entry.id}`}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Eye className="size-4" aria-hidden="true" />
            Details
          </Link>
        </div>
      </div>
    </Card>
  )
}

/** List row — denser, better for scanning long catalogues. */
function ListRow({ entry }) {
  const meta = getFileTypeMeta(entry.fileType || entry.filename)
  return (
    <Card className="flex flex-col gap-4 p-4 transition-colors hover:border-slate-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <TypeIcon entry={entry} />
        <div className="min-w-0 space-y-1">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            <Link to={`/file/${entry.id}`} className="hover:text-blue-700 hover:underline">
              {entry.title}
            </Link>
            <Badge tone={meta.badge}>{meta.label}</Badge>
          </h3>
          <p className="truncate font-mono text-xs text-slate-500">{entry.filename}</p>
          {entry.description ? (
            <p className="clamp-2 text-sm text-slate-600">{entry.description}</p>
          ) : null}
          <MetaRow entry={entry} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:pl-4">
        <DownloadButton entry={entry} size="sm" className="h-9" />
        <Link
          to={`/file/${entry.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Eye className="size-4" aria-hidden="true" />
          Details
        </Link>
      </div>
    </Card>
  )
}

/** FileCard — renders a catalogue entry as a grid card or a list row. */
export function FileCard({ entry, view = 'grid' }) {
  return view === 'list' ? <ListRow entry={entry} /> : <GridCard entry={entry} />
}
