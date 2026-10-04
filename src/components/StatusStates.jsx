import { Inbox, LoaderCircle, RefreshCw, SearchX, ServerCrash, FolderOpen } from 'lucide-react'
import { Button, Card } from './ui.jsx'
import { cx } from '../lib/cx.js'

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

function SkeletonCard() {
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="size-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-auto flex gap-2 pt-2">
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </Card>
  )
}

/** LoadingState — skeleton cards while the catalogue module is being read. */
export function LoadingGrid({ count = 6, label = 'Loading catalogue' }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  )
}

export function LoadingSpinner({ label = 'Working', className }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-sm text-slate-600', className)}>
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Empty / error / not-found                                                   */
/* -------------------------------------------------------------------------- */

/**
 * StatePanel — the shared shell for empty, error and not-found states so they
 * all look and behave the same.
 */
export function StatePanel({ icon: Icon, title, description, action, secondaryAction, tone = 'slate' }) {
  const iconTone =
    tone === 'danger'
      ? 'bg-red-50 text-red-600'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-600'
        : 'bg-slate-100 text-slate-500'

  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className={cx('flex size-12 items-center justify-center rounded-full', iconTone)}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="max-w-md text-sm text-slate-600">{description}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </Card>
  )
}

/** Catalogue is genuinely empty — no files have been added yet. */
export function EmptyLibraryState({ onReset }) {
  return (
    <StatePanel
      icon={Inbox}
      title="No files in the library yet"
      description="The catalogue in src/data/files.json has no entries. Add files to public/files/, describe them in the catalogue, and they will appear here."
      action={
        onReset ? (
          <Button variant="secondary" onClick={onReset}>
            <RefreshCw className="size-4" />
            Reload catalogue
          </Button>
        ) : null
      }
    />
  )
}

/** Filters matched nothing — always explain which filters are active. */
export function NoResultsState({ query, category, typeLabel, onClear }) {
  const filters = []
  if (query) filters.push(`“${query}”`)
  if (category && category !== 'all') filters.push(`category “${category}”`)
  if (typeLabel) filters.push(`file type “${typeLabel}”`)

  return (
    <StatePanel
      icon={SearchX}
      tone="warning"
      title="No files match your search"
      description={
        filters.length
          ? `Nothing matched ${filters.join(' and ')}. Try a shorter search term or clear the filters.`
          : 'Try a different search term.'
      }
      action={
        onClear ? (
          <Button variant="secondary" onClick={onClear}>
            Clear search and filters
          </Button>
        ) : null
      }
    />
  )
}

/** The catalogue module failed to load or parse. */
export function CatalogueErrorState({ error, onRetry }) {
  return (
    <StatePanel
      icon={ServerCrash}
      tone="danger"
      title="The catalogue could not be loaded"
      description={error || 'src/data/files.json could not be read. Check that the file exists and contains valid JSON.'}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        ) : null
      }
    />
  )
}

/** Route or file does not exist. */
export function NotFoundState({ title = 'File not found', description, action }) {
  return (
    <StatePanel icon={FolderOpen} tone="warning" title={title} description={description} action={action} />
  )
}
