import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  ADMIN_SESSION_KEY,
  DEMO_ADMIN_PASSWORD,
  STAGED_CATALOGUE_KEY,
} from '../lib/constants.js'
import { normaliseEntry, sortCatalogue } from '../lib/catalogue.js'
import { localStore, sessionStore } from '../lib/storage.js'
import { useCatalogue } from '../hooks/useCatalogue.js'

/**
 * AdminContext
 *
 * Holds two pieces of state:
 *
 * 1. A demo sign-in flag, stored in sessionStorage. This only hides the admin
 *    *interface*; it cannot protect the files, because every file in
 *    public/files/ is a public static asset. See the notices in the admin UI.
 * 2. A "staged catalogue" — additions, edits and removals the admin has made but
 *    not yet committed. These live in localStorage until exported and committed,
 *    at which point they become the real catalogue.
 */

const AdminContext = createContext(null)

const EMPTY_STAGED = { added: [], edited: {}, removed: [] }

function readStaged() {
  const raw = localStore.read(STAGED_CATALOGUE_KEY)
  if (!raw || typeof raw !== 'object') return EMPTY_STAGED
  return {
    added: Array.isArray(raw.added) ? raw.added.map(normaliseEntry) : [],
    edited: raw.edited && typeof raw.edited === 'object' ? raw.edited : {},
    removed: Array.isArray(raw.removed) ? raw.removed : [],
  }
}

export function AdminProvider({ children }) {
  const catalogue = useCatalogue()
  const [session, setSession] = useState(() => sessionStore.read(ADMIN_SESSION_KEY) ?? null)
  const [staged, setStaged] = useState(readStaged)
  const [lastExport, setLastExport] = useState(null)

  /* Persist staged changes so a refresh does not lose work. */
  useEffect(() => {
    localStore.write(STAGED_CATALOGUE_KEY, staged)
  }, [staged])

  /* -------------------------------- auth ---------------------------------- */

  const signIn = useCallback((password) => {
    if (String(password ?? '') !== DEMO_ADMIN_PASSWORD) {
      return {
        ok: false,
        error:
          'That password does not match the demo password. The demo password is shown on the sign-in card.',
      }
    }
    const next = { signedInAt: new Date().toISOString(), method: 'demo-password' }
    sessionStore.write(ADMIN_SESSION_KEY, next)
    setSession(next)
    return { ok: true }
  }, [])

  const signOut = useCallback(() => {
    sessionStore.remove(ADMIN_SESSION_KEY)
    setSession(null)
  }, [])

  const isAuthenticated = Boolean(session)

  /* --------------------------- staged catalogue --------------------------- */

  const entries = useMemo(() => {
    const removed = new Set(staged.removed)
    const base = catalogue.entries
      .filter((entry) => !removed.has(entry.id))
      .map((entry) => (staged.edited[entry.id] ? normaliseEntry({ ...entry, ...staged.edited[entry.id] }) : entry))
    const added = staged.added.filter((entry) => !removed.has(entry.id))
    const merged = [...base]
    for (const entry of added) {
      const index = merged.findIndex((item) => item.id === entry.id)
      if (index === -1) merged.push(entry)
      else merged[index] = entry
    }
    return sortCatalogue(merged, 'title-asc')
  }, [catalogue.entries, staged])

  const addEntry = useCallback((entry) => {
    const clean = normaliseEntry(entry)
    setStaged((current) => ({
      added: [...current.added.filter((item) => item.id !== clean.id), clean],
      edited: { ...current.edited, [clean.id]: undefined },
      removed: current.removed.filter((id) => id !== clean.id),
    }))
  }, [])

  const updateEntry = useCallback((id, patch) => {
    setStaged((current) => {
      if (current.added.some((item) => item.id === id)) {
        return {
          ...current,
          added: current.added.map((item) => (item.id === id ? normaliseEntry({ ...item, ...patch }) : item)),
        }
      }
      return {
        ...current,
        edited: { ...current.edited, [id]: { ...(current.edited[id] ?? {}), ...patch } },
      }
    })
  }, [])

  const removeEntry = useCallback((id) => {
    setStaged((current) => {
      const edited = { ...current.edited }
      delete edited[id]
      return {
        added: current.added.filter((item) => item.id !== id),
        edited,
        removed: current.removed.includes(id) ? current.removed : [...current.removed, id],
      }
    })
  }, [])

  const undoRemove = useCallback((id) => {
    setStaged((current) => ({ ...current, removed: current.removed.filter((item) => item !== id) }))
  }, [])

  const resetStaged = useCallback(() => setStaged(EMPTY_STAGED), [])

  const changeSummary = useMemo(() => {
    const lines = []
    for (const entry of staged.added) lines.push(`+ added    ${entry.filename}`)
    for (const id of Object.keys(staged.edited)) {
      if (!staged.edited[id]) continue
      const entry = entries.find((item) => item.id === id)
      lines.push(`~ edited   ${entry?.filename ?? id}`)
    }
    for (const id of staged.removed) {
      const entry = catalogue.entries.find((item) => item.id === id)
      lines.push(`- removed  ${entry?.filename ?? id}`)
    }
    return {
      lines,
      counts: {
        added: staged.added.length,
        edited: Object.keys(staged.edited).filter((id) => staged.edited[id]).length,
        removed: staged.removed.length,
      },
      hasChanges: lines.length > 0,
    }
  }, [catalogue.entries, entries, staged])

  const value = useMemo(
    () => ({
      isAuthenticated,
      session,
      signIn,
      signOut,
      catalogue,
      entries,
      staged,
      addEntry,
      updateEntry,
      removeEntry,
      undoRemove,
      resetStaged,
      changeSummary,
      lastExport,
      setLastExport,
    }),
    [
      isAuthenticated,
      session,
      signIn,
      signOut,
      catalogue,
      entries,
      staged,
      addEntry,
      updateEntry,
      removeEntry,
      undoRemove,
      resetStaged,
      changeSummary,
      lastExport,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used inside <AdminProvider>')
  return context
}

/** Route guard for /admin — redirects to the sign-in screen when needed. */
export function RequireAdmin({ children }) {
  const { isAuthenticated } = useAdmin()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/sign-in" replace state={{ from: location.pathname }} />
  }
  return children
}
