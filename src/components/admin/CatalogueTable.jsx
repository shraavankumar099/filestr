import { useMemo, useState } from 'react'
import { AlertCircle, Pencil, Search, Trash2, Undo2, X } from 'lucide-react'
import { Badge, Button, Card, Select, TextInput } from '../ui.jsx'
import { EntryForm } from './EntryForm.jsx'
import { getFileTypeMeta } from '../../lib/constants.js'
import { formatBytes, formatDate } from '../../lib/fileUtils.js'
import { matchesQuery, normaliseEntry } from '../../lib/catalogue.js'
import { cx } from '../../lib/cx.js'

function StatusBadge({ entry, staged }) {
  const isNew = staged.added.some((item) => item.id === entry.id)
  const isEdited = !isNew && Boolean(staged.edited[entry.id])
  if (isNew) return <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Staged · new</Badge>
  if (isEdited) return <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/20">Staged · edited</Badge>
  return <Badge>In catalogue</Badge>
}

function EditRow({ entry, categories, onSave, onCancel }) {
  const [values, setValues] = useState(() => normaliseEntry(entry))
  const errors = {}
  if (!String(values.title).trim()) errors.title = 'A title is required.'
  if (!String(values.category).trim()) errors.category = 'A category is required.'
  if (!String(values.filename).trim()) errors.filename = 'A filename is required.'

  return (
    <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4">
      <EntryForm
        values={values}
        onChange={setValues}
        errors={errors}
        categories={categories}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => onSave(normaliseEntry(values))}
          disabled={Object.keys(errors).length > 0}
        >
          Save to staged catalogue
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <p className="text-xs text-slate-500">
          Saving stages the change in this browser. Nothing is written to the project until you export the catalogue and
          commit it.
        </p>
      </div>
    </div>
  )
}

/**
 * CatalogueTable — the catalogue management view: every entry, its staged status,
 * an inline editor and a remove control.
 */
export function CatalogueTable({ entries, staged, onUpdate, onRemove, onUndoRemove, categories }) {
  const [editingId, setEditingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (categoryFilter === 'all' || entry.category === categoryFilter) && matchesQuery(entry, query),
      ),
    [categoryFilter, entries, query],
  )

  const removedEntries = staged.removed
    .map((id) => ({ id }))
    .filter((item) => item.id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter entries by title, filename or description…"
            className="pl-9"
            aria-label="Filter catalogue entries"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-10 w-auto text-sm"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <p className="text-xs text-slate-500">
          {visible.length} of {entries.length} entries
        </p>
      </div>

      {removedEntries.length > 0 ? (
        <Card className="flex flex-wrap items-center gap-3 border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">
            {removedEntries.length} entr{removedEntries.length === 1 ? 'y is' : 'ies are'} staged for removal. The file
            itself stays in <span className="font-mono text-xs">public/files/</span> until you delete it in your
            repository.
          </p>
          <div className="flex flex-wrap gap-2">
            {removedEntries.map(({ id }) => (
              <Button key={id} size="sm" variant="secondary" onClick={() => onUndoRemove(id)}>
                <Undo2 className="size-3.5" aria-hidden="true" />
                Undo {id}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      {visible.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">No entries match this filter</p>
          <p className="mt-1 text-sm text-slate-600">
            Clear the search box or pick a different category to see the rest of the catalogue.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-200 overflow-hidden">
          {visible.map((entry) => {
            const meta = getFileTypeMeta(entry.fileType || entry.filename)
            const isEditing = editingId === entry.id
            const isConfirming = confirmingId === entry.id

            return (
              <div key={entry.id}>
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <span
                    className={cx(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                      meta.badge,
                    )}
                    aria-hidden="true"
                  >
                    <meta.Icon className={cx('size-4.5', meta.icon)} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{entry.title}</p>
                      <StatusBadge entry={entry} staged={staged} />
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                      {entry.filename} · {formatBytes(entry.size)} · {entry.category}
                      {entry.addedAt ? ` · ${formatDate(entry.addedAt)}` : ''}
                    </p>
                    {entry.description ? (
                      <p className="clamp-2 mt-1 text-xs text-slate-600">{entry.description}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setConfirmingId(null)
                        setEditingId(isEditing ? null : entry.id)
                      }}
                    >
                      {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
                      {isEditing ? 'Close' : 'Edit'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setEditingId(null)
                        setConfirmingId(isConfirming ? null : entry.id)
                      }}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>

                {isConfirming ? (
                  <div className="flex flex-col gap-3 border-t border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center">
                    <p className="flex-1 text-sm text-red-900">
                      Remove <strong>{entry.title}</strong> from the catalogue? The entry disappears from the staged
                      catalogue and is listed as a removal when you export. The file in{' '}
                      <span className="font-mono text-xs">public/files/</span> is untouched — delete it in your
                      repository as well, or its URL stays public.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="dangerSolid"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          onRemove(entry.id)
                          setConfirmingId(null)
                        }}
                      >
                        Yes, remove entry
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-9"
                        onClick={() => setConfirmingId(null)}
                      >
                        Keep it
                      </Button>
                    </div>
                  </div>
                ) : null}

                {isEditing ? (
                  <EditRow
                    entry={entry}
                    categories={categories}
                    onCancel={() => setEditingId(null)}
                    onSave={(values) => {
                      onUpdate(entry.id, values)
                      setEditingId(null)
                    }}
                  />
                ) : null}
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
