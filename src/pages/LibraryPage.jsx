import { useDeferredValue, useMemo, useState } from 'react'
import { Database, FolderOpen, HardDrive, Layers, ShieldCheck } from 'lucide-react'
import { SearchBar } from '../components/SearchBar.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { FileCard } from '../components/FileCard.jsx'
import {
  CatalogueErrorState,
  EmptyLibraryState,
  LoadingGrid,
  NoResultsState,
} from '../components/StatusStates.jsx'
import { SectionLabel } from '../components/ui.jsx'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR, getAvailableTypeGroups } from '../lib/constants.js'
import { filterCatalogue, sortCatalogue } from '../lib/catalogue.js'
import { formatBytes } from '../lib/fileUtils.js'
import { useCatalogue } from '../hooks/useCatalogue.js'

const DEFAULT_FILTERS = { query: '', category: 'all', type: 'all', sort: 'newest' }

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
      <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">{value}</span>
        <span className="block text-[11px] text-slate-500">{label}</span>
      </span>
    </div>
  )
}

export function LibraryPage() {
  const { status, entries, error, categories, summary, reload } = useCatalogue()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [view, setView] = useState('grid')

  // Keeps typing responsive while a large catalogue re-filters.
  const deferredQuery = useDeferredValue(filters.query)

  const typeGroups = useMemo(() => getAvailableTypeGroups(entries), [entries])

  const visibleFiles = useMemo(
    () =>
      sortCatalogue(
        filterCatalogue(entries, {
          query: deferredQuery,
          category: filters.category,
          type: filters.type,
        }),
        filters.sort,
      ),
    [deferredQuery, entries, filters.category, filters.sort, filters.type],
  )

  const activeTypeLabel =
    filters.type === 'all' ? null : (typeGroups.find((group) => group.key === filters.type)?.label ?? filters.type)

  const activeFilterCount =
    (filters.query.trim() ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0)

  function update(patch) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  const isReady = status === 'ready'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <SectionLabel>File library</SectionLabel>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Downloadable notes, decks and templates
          </h1>
          <p className="text-base text-slate-600">
            Every file here is a static asset committed to this repository and served by the same host as the page —
            no database, no storage service, no backend. Pick a file and download it directly.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isReady ? (
            <>
              <StatPill icon={Layers} label="files" value={summary.files} />
              <StatPill icon={FolderOpen} label="categories" value={summary.categories} />
              <StatPill icon={HardDrive} label="total size" value={formatBytes(summary.bytes)} />
            </>
          ) : (
            <>
              <StatPill icon={Layers} label="files" value="—" />
              <StatPill icon={FolderOpen} label="categories" value="—" />
              <StatPill icon={HardDrive} label="total size" value="—" />
            </>
          )}
        </div>

        {isReady ? (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <Database className="size-3.5 text-slate-400" aria-hidden="true" />
              Catalogue: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{CATALOGUE_PATH}</code>
            </span>
            <span className="inline-flex items-center gap-2">
              <FolderOpen className="size-3.5 text-slate-400" aria-hidden="true" />
              Files: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{PUBLIC_FILES_DIR}</code>
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-slate-400" aria-hidden="true" />
              Public assets — anyone with the link can download them
            </span>
          </div>
        ) : null}
      </header>

      {/* Controls */}
      {isReady ? (
        <section className="mt-8 space-y-5" aria-label="Search and filters">
          <SearchBar
            value={filters.query}
            onChange={(value) => update({ query: value })}
            resultCount={visibleFiles.length}
            totalCount={entries.length}
          />
          <FilterBar
            categories={categories}
            category={filters.category}
            onCategoryChange={(value) => update({ category: value })}
            types={typeGroups}
            type={filters.type}
            onTypeChange={(value) => update({ type: value })}
            sort={filters.sort}
            onSortChange={(value) => update({ sort: value })}
            view={view}
            onViewChange={setView}
            activeFilterCount={activeFilterCount}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </section>
      ) : null}

      {/* Results */}
      <section className="mt-6" aria-label="Files">
        {status === 'loading' ? <LoadingGrid /> : null}

        {status === 'error' ? <CatalogueErrorState error={error} onRetry={reload} /> : null}

        {isReady && entries.length === 0 ? <EmptyLibraryState onReset={reload} /> : null}

        {isReady && entries.length > 0 && visibleFiles.length === 0 ? (
          <NoResultsState
            query={filters.query.trim()}
            category={filters.category}
            typeLabel={activeTypeLabel}
            onClear={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : null}

        {isReady && visibleFiles.length > 0 ? (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-3'
            }
          >
            {visibleFiles.map((entry) => (
              <FileCard key={entry.id} entry={entry} view={view} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
