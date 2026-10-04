import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Eye, FileText, FolderOpen, Hash, HardDrive, Tag, Link2 } from 'lucide-react'
import { Badge, Button, Card, SectionLabel } from '../components/ui.jsx'
import { DownloadButton, CopyLinkButton } from '../components/DownloadButton.jsx'
import { Callout } from '../components/Callout.jsx'
import { CatalogueErrorState, LoadingGrid, NotFoundState } from '../components/StatusStates.jsx'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR, getFileTypeMeta } from '../lib/constants.js'
import { formatBytes, formatDate } from '../lib/fileUtils.js'
import { useCatalogue } from '../hooks/useCatalogue.js'

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
        <dd className="mt-0.5 text-sm break-words text-slate-900">{children}</dd>
      </div>
    </div>
  )
}

export function FileDetailPage() {
  const { fileId } = useParams()
  const { status, entries, error, reload } = useCatalogue()
  const entry = entries.find((item) => item.id === fileId)

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <LoadingGrid count={2} label="Loading file details" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <CatalogueErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <NotFoundState
          title="That file is not in the catalogue"
          description={`No entry with the id “${fileId}” exists in ${CATALOGUE_PATH}. It may have been renamed or removed.`}
          action={
            <Button as={Link} to="/" variant="secondary">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to the library
            </Button>
          }
        />
      </div>
    )
  }

  const meta = getFileTypeMeta(entry.fileType || entry.filename)
  const canEmbedPdf = meta.key === 'pdf'

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link to="/" className="font-medium text-blue-700 hover:underline">
          Library
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-500">{entry.category}</span>
      </nav>

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span
            className={`flex size-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${meta.badge}`}
            aria-hidden="true"
          >
            <meta.Icon className={`size-7 ${meta.icon}`} />
          </span>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.badge}>{meta.label}</Badge>
              <Badge>
                <Tag className="size-3" aria-hidden="true" />
                {entry.category}
              </Badge>
              {entry.addedAt ? (
                <Badge>
                  <Calendar className="size-3" aria-hidden="true" />
                  Added {formatDate(entry.addedAt)}
                </Badge>
              ) : null}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{entry.title}</h1>

            <p className="text-sm text-slate-600">
              {entry.description || 'No description has been recorded for this file.'}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <DownloadButton entry={entry} label={`Download ${formatBytes(entry.size)} file`} />
              <CopyLinkButton entry={entry} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="p-5 md:col-span-3">
          <SectionLabel>Catalogue record</SectionLabel>
          <dl className="mt-2 divide-y divide-slate-100">
            <DetailRow icon={FileText} label="Title">
              {entry.title}
            </DetailRow>
            <DetailRow icon={FolderOpen} label="Filename">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{entry.filename}</code>
            </DetailRow>
            <DetailRow icon={HardDrive} label="Size">
              {formatBytes(entry.size)}
              {entry.size ? (
                <span className="ml-2 font-mono text-xs text-slate-500">{entry.size.toLocaleString()} bytes</span>
              ) : null}
            </DetailRow>
            <DetailRow icon={Hash} label="Catalogue id">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{entry.id}</code>
            </DetailRow>
            <DetailRow icon={Link2} label="Static URL">
              <a
                href={entry.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs break-all text-blue-700 hover:underline"
              >
                {entry.url}
              </a>
            </DetailRow>
          </dl>
        </Card>

        <div className="space-y-6 md:col-span-2">
          <Callout tone="info" title="Where this file lives">
            <p className="text-xs">
              The bytes are stored at{' '}
              <code className="rounded bg-slate-100 px-1 font-mono">
                {PUBLIC_FILES_DIR}
                {entry.filename}
              </code>{' '}
              and described in <code className="rounded bg-slate-100 px-1 font-mono">{CATALOGUE_PATH}</code>. Deleting
              the file from the repository removes the download; deleting only the entry leaves the URL reachable.
            </p>
          </Callout>

          {canEmbedPdf ? (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
                <Eye className="size-4 text-slate-500" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-700">Inline preview</span>
              </div>
              <iframe
                src={entry.url}
                title={`Preview of ${entry.title}`}
                className="h-72 w-full bg-slate-50"
              />
            </Card>
          ) : (
            <Callout tone="info" title="Preview unavailable in the browser">
              <p className="text-xs">
                {meta.label} files cannot be rendered inline. Download the file to open it in the right application.
              </p>
            </Callout>
          )}
        </div>
      </div>

      <div>
        <Button as={Link} to="/" variant="secondary">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the library
        </Button>
      </div>
    </div>
  )
}
