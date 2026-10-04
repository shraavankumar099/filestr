import { getFileTypeMeta, resolveFileType } from './constants.js'
import { slugify } from './fileUtils.js'

/**
 * Catalogue helpers.
 *
 * The catalogue is a plain JSON file that ships with the app. Everything here is
 * pure data-shaping: normalise, filter, sort, and serialise entries back to the
 * exact JSON shape that `src/data/files.json` expects.
 */

/** The canonical field order / shape of a catalogue entry. */
export const CATALOGUE_FIELDS = [
  'id',
  'title',
  'filename',
  'description',
  'category',
  'fileType',
  'size',
  'url',
  'addedAt',
]

/** The documented shape, written out for the admin UI and the docs. */
export const CATALOGUE_ENTRY_EXAMPLE = {
  id: 'dsa-notes',
  title: 'Data Structures & Algorithms — Revision Notes',
  filename: 'dsa-notes.pdf',
  description: 'Condensed revision notes covering arrays, trees and graphs.',
  category: 'Notes',
  fileType: 'pdf',
  size: 418304,
  url: '/files/dsa-notes.pdf',
  addedAt: '2026-03-12',
}

/** Fills in missing/derived fields so a hand-edited entry never breaks the UI. */
export function normaliseEntry(entry) {
  const filename = String(entry?.filename ?? '').trim()
  const ext = resolveFileType(filename)
  const fileType = String(entry?.fileType ?? '').trim().toLowerCase() || ext || 'file'
  return {
    id: String(entry?.id ?? '').trim() || slugify(filename || entry?.title || 'file'),
    title: String(entry?.title ?? '').trim() || filename || 'Untitled file',
    filename,
    description: String(entry?.description ?? '').trim(),
    category: String(entry?.category ?? '').trim() || 'Uncategorised',
    fileType,
    size: Number(entry?.size) > 0 ? Number(entry.size) : 0,
    url: String(entry?.url ?? '').trim() || `/files/${filename}`,
    addedAt: String(entry?.addedAt ?? '').trim(),
  }
}

/** Normalises a whole list, dropping entries with no filename. */
export function normaliseCatalogue(entries) {
  if (!Array.isArray(entries)) return []
  return entries.filter((entry) => entry && entry.filename).map(normaliseEntry)
}

/** Builds a catalogue entry for a file the admin is about to export. */
export function buildEntry({ title, filename, description, category, size, fileType, addedAt }) {
  const ext = resolveFileType(filename)
  return normaliseEntry({
    id: slugify(filename),
    title,
    filename,
    description,
    category,
    fileType: fileType || ext,
    size,
    url: `/files/${filename}`,
    addedAt,
  })
}

/** Suggestions offered in the filename field, e.g. "DSA Notes 2026.pdf" -> "dsa-notes-2026.pdf". */
export function suggestFilename(title, extension = 'pdf') {
  const base = slugify(title) || 'file'
  return `${base}.${extension}`
}

/* -------------------------------------------------------------------------- */
/* Search / filter / sort                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Case-insensitive search across title, filename, description and category.
 * Every whitespace-separated term must match somewhere (AND semantics).
 */
export function matchesQuery(entry, query) {
  const terms = String(query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return true
  const haystack = [entry.title, entry.filename, entry.description, entry.category]
    .join(' ')
    .toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

/**
 * `type` is a file-type *group* key from `FILE_TYPE_GROUPS` (for example
 * "archive" covers .zip/.rar/.7z). A raw extension is accepted too, so a filter
 * value of "pdf" works because the PDF group itself is keyed "pdf".
 */
export function filterCatalogue(entries, { query = '', category = 'all', type = 'all' } = {}) {
  return entries.filter((entry) => {
    if (category !== 'all' && entry.category !== category) return false
    if (type !== 'all') {
      const declared = String(entry.fileType || resolveFileType(entry.filename)).toLowerCase()
      if (getFileTypeMeta(declared).key !== type && declared !== type) return false
    }
    return matchesQuery(entry, query)
  })
}

export function sortCatalogue(entries, sort = 'newest') {
  const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  const byDate = (a, b) => String(b.addedAt).localeCompare(String(a.addedAt))
  const list = [...entries]

  switch (sort) {
    case 'oldest':
      return list.sort((a, b) => -byDate(a, b) || byTitle(a, b))
    case 'title-asc':
      return list.sort(byTitle)
    case 'title-desc':
      return list.sort((a, b) => -byTitle(a, b))
    case 'size-desc':
      return list.sort((a, b) => b.size - a.size || byTitle(a, b))
    case 'size-asc':
      return list.sort((a, b) => a.size - b.size || byTitle(a, b))
    case 'type-asc':
      return list.sort((a, b) => a.fileType.localeCompare(b.fileType) || byTitle(a, b))
    case 'newest':
    default:
      return list.sort((a, b) => byDate(a, b) || byTitle(a, b))
  }
}

/** Distinct categories in catalogue order, falling back to alphabetical. */
export function collectCategories(entries) {
  const counts = new Map()
  for (const entry of entries) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Library-wide totals for the header stats. */
export function summariseCatalogue(entries) {
  return {
    files: entries.length,
    bytes: entries.reduce((total, entry) => total + (entry.size || 0), 0),
    categories: new Set(entries.map((entry) => entry.category)).size,
  }
}

/* -------------------------------------------------------------------------- */
/* Serialisation                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Renders the catalogue back to the exact JSON text that belongs in
 * src/data/files.json — field order preserved, 2-space indent, trailing newline.
 */
export function serialiseCatalogue(entries) {
  const ordered = entries.map((entry) => {
    const normalised = normaliseEntry(entry)
    const out = {}
    for (const field of CATALOGUE_FIELDS) if (normalised[field] !== '') out[field] = normalised[field]
    return out
  })
  return `${JSON.stringify(ordered, null, 2)}\n`
}

/** Merges a new entry into a catalogue, replacing any entry with the same id. */
export function upsertEntry(entries, entry) {
  const index = entries.findIndex((item) => item.id === entry.id)
  if (index === -1) return [...entries, entry]
  const next = [...entries]
  next[index] = entry
  return next
}

/** Sorted, human-readable catalogue for the "current catalogue" preview panel. */
export function previewCatalogue(entries) {
  return sortCatalogue(normaliseCatalogue(entries), 'newest')
}
