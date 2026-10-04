import {
  File,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/* Paths used by the app and by the instructions the admin panel prints.       */
/* -------------------------------------------------------------------------- */

export const CATALOGUE_PATH = 'src/data/files.json'
export const PUBLIC_FILES_DIR = 'public/files/'
export const CATALOGUE_IMPORT_PATH = '../data/files.json'

/* -------------------------------------------------------------------------- */
/* Admin session (demo only — see README security notes).                      */
/* -------------------------------------------------------------------------- */

/**
 * Demo password. This is compiled into the client bundle, which means anyone can
 * read it. It gates the admin *interface* only; it does not protect the files
 * themselves, which are public static assets.
 */
export const DEMO_ADMIN_PASSWORD = 'fileshelf-admin'

/** sessionStorage key for the demo admin session — cleared when the tab closes. */
export const ADMIN_SESSION_KEY = 'fileshelf:admin-session'

/** localStorage key holding the staged (uncommitted) catalogue changes. */
export const STAGED_CATALOGUE_KEY = 'fileshelf:staged-catalogue'

/* -------------------------------------------------------------------------- */
/* Validation limits                                                            */
/* -------------------------------------------------------------------------- */

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export const ALLOWED_EXTENSIONS = [
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'txt',
  'md',
  'json',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'svg',
  'zip',
  'rar',
  '7z',
  'gz',
  'tar',
  'mp4',
  'mov',
  'webm',
  'mp3',
  'wav',
]

export const DEFAULT_CATEGORIES = [
  'Notes',
  'Presentations',
  'Reference',
  'Guides',
  'Design',
  'Templates',
  'Archives',
  'Other',
]

/* -------------------------------------------------------------------------- */
/* Sorting                                                                      */
/* -------------------------------------------------------------------------- */

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'title-desc', label: 'Title (Z–A)' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'type-asc', label: 'File type' },
]

/* -------------------------------------------------------------------------- */
/* File-type presentation map                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Each entry maps a set of extensions to a label, icon and a full set of Tailwind
 * classes (full class strings so Tailwind's scanner can see them at build time).
 */
const TYPE_GROUPS = [
  {
    key: 'pdf',
    label: 'PDF',
    extensions: ['pdf'],
    Icon: FileText,
    badge: 'bg-red-50 text-red-700 ring-red-600/20',
    icon: 'text-red-600',
    dot: 'bg-red-500',
  },
  {
    key: 'presentation',
    label: 'Presentation',
    extensions: ['ppt', 'pptx', 'key', 'odp'],
    Icon: Presentation,
    badge: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    icon: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  {
    key: 'spreadsheet',
    label: 'Spreadsheet',
    extensions: ['xls', 'xlsx', 'csv', 'ods', 'tsv'],
    Icon: FileSpreadsheet,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    key: 'document',
    label: 'Document',
    extensions: ['doc', 'docx', 'odt', 'rtf', 'pages'],
    Icon: FileText,
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    icon: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  {
    key: 'text',
    label: 'Plain text',
    extensions: ['txt', 'md', 'markdown', 'log'],
    Icon: FileText,
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    icon: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  {
    key: 'data',
    label: 'Data',
    extensions: ['json', 'xml', 'yml', 'yaml'],
    Icon: FileJson,
    badge: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
    icon: 'text-yellow-700',
    dot: 'bg-yellow-500',
  },
  {
    key: 'code',
    label: 'Code',
    extensions: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'sh', 'sql'],
    Icon: FileCode2,
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    icon: 'text-indigo-600',
    dot: 'bg-indigo-500',
  },
  {
    key: 'archive',
    label: 'Archive',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz'],
    Icon: FileArchive,
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    icon: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  {
    key: 'image',
    label: 'Image',
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'bmp', 'ico'],
    Icon: FileImage,
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    icon: 'text-sky-600',
    dot: 'bg-sky-500',
  },
  {
    key: 'video',
    label: 'Video',
    extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi'],
    Icon: FileVideo,
    badge: 'bg-pink-50 text-pink-700 ring-pink-600/20',
    icon: 'text-pink-600',
    dot: 'bg-pink-500',
  },
  {
    key: 'audio',
    label: 'Audio',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
    Icon: FileAudio,
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    icon: 'text-amber-700',
    dot: 'bg-amber-500',
  },
]

const FALLBACK_TYPE = {
  key: 'file',
  label: 'File',
  extensions: [],
  Icon: File,
  badge: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  icon: 'text-slate-600',
  dot: 'bg-slate-400',
}

/** Every type group, in display order. */
export const FILE_TYPE_GROUPS = TYPE_GROUPS

/** Strips directories and returns the lowercase extension, e.g. "Report.PDF" -> "pdf".
 *  Returns '' when the name has no extension at all. */
export function getExtension(input) {
  const value = String(input ?? '').trim().toLowerCase()
  if (!value) return ''
  const base = value.split(/[\\/]/).pop()
  const dot = base.lastIndexOf('.')
  return dot === -1 ? '' : base.slice(dot + 1)
}

/**
 * Resolves a lowercase type token from either a filename ("notes.PDF") or a bare
 * declared type ("pdf"). Returns '' when nothing usable can be derived, so
 * callers can fall back to a generic presentation.
 */
export function resolveFileType(input) {
  const value = String(input ?? '').trim().toLowerCase()
  if (!value) return ''
  const base = value.split(/[\\/]/).pop()
  const dot = base.lastIndexOf('.')
  const token = dot === -1 ? base : base.slice(dot + 1)
  return /^[a-z0-9]{1,8}$/.test(token) ? token : ''
}

/**
 * Resolves presentation metadata for a filename ("notes.pdf") or a bare type
 * ("pdf"). Always returns something usable, falling back to a generic file icon.
 */
export function getFileTypeMeta(input) {
  const token = resolveFileType(input)
  return TYPE_GROUPS.find((group) => group.extensions.includes(token)) ?? FALLBACK_TYPE
}

/** Human label for a filename or bare type, e.g. "pdf" -> "PDF". */
export function getFileTypeLabel(input) {
  return getFileTypeMeta(input).label
}

/** Distinct type groups present in a list of catalogue entries, used by filters. */
export function getAvailableTypeGroups(entries) {
  const seen = new Map()
  for (const entry of entries) {
    const meta = getFileTypeMeta(entry.fileType || entry.filename)
    if (!seen.has(meta.key)) seen.set(meta.key, meta)
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
}
