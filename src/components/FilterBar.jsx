import { ArrowUpDown, LayoutGrid, List, RotateCcw } from 'lucide-react'
import { Select, SegmentedControl } from './ui.jsx'
import { SORT_OPTIONS } from '../lib/constants.js'
import { cx } from '../lib/cx.js'

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid className="size-3.5" aria-hidden="true" /> },
  { value: 'list', label: 'List', icon: <List className="size-3.5" aria-hidden="true" /> },
]

/**
 * FilterBar — category chips, a file-type filter, sorting and the view toggle.
 * All state lives in the page so the URL-free state stays in one place.
 */
export function FilterBar({
  categories,
  category,
  onCategoryChange,
  types,
  type,
  onTypeChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  activeFilterCount,
  onReset,
}) {
  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Category</span>
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={category === 'all'}
            onClick={() => onCategoryChange('all')}
            label="All files"
          />
          {categories.map((item) => (
            <CategoryChip
              key={item.name}
              active={category === item.name}
              onClick={() => onCategoryChange(item.name)}
              label={item.name}
              count={item.count}
            />
          ))}
        </div>
      </div>

      {/* Type, sort, view */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="text-xs font-medium text-slate-600">
            File type
          </label>
          <Select
            id="type-filter"
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            className="h-9 w-auto py-0 text-xs"
          >
            <option value="all">All types</option>
            {types.map((typeGroup) => (
              <option key={typeGroup.key} value={typeGroup.key}>
                {typeGroup.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <ArrowUpDown className="size-3.5" aria-hidden="true" />
            Sort
          </label>
          <Select
            id="sort-select"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-9 w-auto py-0 text-xs"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset filters
            </button>
          ) : null}
          <SegmentedControl
            label="Layout"
            options={VIEW_OPTIONS}
            value={view}
            onChange={onViewChange}
          />
        </div>
      </div>
    </div>
  )
}

function CategoryChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
      )}
    >
      {label}
      {typeof count === 'number' ? (
        <span
          className={cx(
            'rounded-full px-1.5 text-[10px] font-semibold',
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
