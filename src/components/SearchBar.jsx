import { Search, X } from 'lucide-react'

/**
 * SearchBar — searches title, filename, description and category.
 * The result count is announced politely for screen readers.
 */
export function SearchBar({ value, onChange, resultCount, totalCount, className }) {
  const hasQuery = value.trim().length > 0

  return (
    <div className={className}>
      <label htmlFor="library-search" className="sr-only">
        Search files by title, filename, description or category
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="library-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by title, filename, description or category…"
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pr-10 pl-10 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-slate-500" aria-live="polite">
        {typeof resultCount === 'number' && typeof totalCount === 'number'
          ? `Showing ${resultCount} of ${totalCount} file${totalCount === 1 ? '' : 's'}${hasQuery ? ` for “${value.trim()}”` : ''}`
          : null}
      </p>
    </div>
  )
}
