import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, getExtension } from './constants.js'

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                          */
/* -------------------------------------------------------------------------- */

/** 0 -> "—", 1024 -> "1 KB", 1536 -> "1.5 KB", 2_500_000 -> "2.4 MB" */
export function formatBytes(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  const rounded = unit === 0 ? Math.round(size) : Math.round(size * 10) / 10
  return `${rounded} ${units[unit]}`
}

/** Formats an ISO date string as "12 Mar 2026"; returns '' when unusable. */
export function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Today as YYYY-MM-DD — the value stored in `addedAt`. */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/* -------------------------------------------------------------------------- */
/* Filename helpers                                                             */
/* -------------------------------------------------------------------------- */

/** "My Report (Final).PDF" -> "my-report-final" — a stable, readable id. */
export function slugify(input) {
  return String(input ?? '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,8}$/i, '')
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Lowercases/spaces→dashes a filename while preserving its extension. */
export function normaliseFilename(name) {
  const raw = String(name ?? '').trim()
  const ext = getExtension(raw)
  const base = raw.replace(/\.[a-z0-9]{1,8}$/i, '')
  const safeBase =
    slugify(base)
      .replace(/^-+|-+$/g, '') || 'file'
  return ext ? `${safeBase}.${ext}` : safeBase
}

/** True when the string is a plain filename (no directories, no traversal). */
export function isPlainFilename(name) {
  const value = String(name ?? '').trim()
  return (
    value.length > 0 &&
    value.length <= 120 &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('..') &&
    !/^[.\s]/.test(value) &&
    /^[\w\-. ()+&']+$/.test(value)
  )
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Validates a selected File plus its metadata before it can be packaged.
 * Returns { errors, warnings, valid } — the UI renders both lists.
 */
export function validateSelection({ file, title, category, filename }, catalogue = []) {
  const errors = []
  const warnings = []

  if (!file) {
    errors.push('Choose a file to package.')
    return { errors, warnings, valid: false }
  }

  const targetName = String(filename || file.name || '').trim()
  const ext = getExtension(targetName)

  if (!Number.isFinite(file.size) || file.size === 0) {
    errors.push('The selected file is empty (0 bytes).')
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push(
      `The file is ${formatBytes(file.size)}, which exceeds the ${formatBytes(
        MAX_FILE_SIZE_BYTES,
      )} limit for this library.`,
    )
  }
  if (!ext) {
    errors.push('The filename has no extension, so the file type cannot be shown.')
  } else if (!ALLOWED_EXTENSIONS.includes(ext)) {
    warnings.push(
      `.${ext} is not on the recommended list (${ALLOWED_EXTENSIONS.slice(0, 8).join(', ')}, …) — it can still be exported, but visitors may not be able to open it.`,
    )
  }
  if (!isPlainFilename(targetName)) {
    errors.push(
      'Use a plain filename: no folders, no "..", no leading dots, and only letters, numbers, spaces or - _ . ( ) + &.',
    )
  }
  if (catalogue.some((entry) => entry.filename === targetName)) {
    errors.push(`"${targetName}" is already in the catalogue. Rename the file or remove the existing entry.`)
  }

  if (!String(title ?? '').trim()) {
    errors.push('Add a title — it is the heading visitors see.')
  } else if (String(title).trim().length < 3) {
    warnings.push('Short titles are hard to scan; a few more words help.')
  }
  if (!String(category ?? '').trim()) {
    errors.push('Pick a category so the file can be filtered.')
  }

  return { errors, warnings, valid: errors.length === 0 }
}

/* -------------------------------------------------------------------------- */
/* Browser download helpers                                                     */
/* -------------------------------------------------------------------------- */

/** Triggers a browser save-as for a Blob (used for the ZIP / JSON exports). */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a moment to start the transfer before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Triggers a save-as for a plain string (catalogue JSON, instructions, …). */
export function downloadText(text, filename, type = 'application/json') {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename)
}

/** Copies text to the clipboard, returning false when the browser blocks it. */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
