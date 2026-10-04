/**
 * Small storage wrappers.
 *
 * FileShelf is frontend-only, so anything the admin panel needs to remember
 * between visits is kept in the browser. These helpers degrade gracefully when
 * storage is unavailable (private browsing, storage disabled, quota exceeded).
 */

function safeRead(storage, key) {
  try {
    const raw = storage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function safeWrite(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const sessionStore = {
  read: (key) => safeRead(window.sessionStorage, key),
  write: (key, value) => safeWrite(window.sessionStorage, key, value),
  remove: (key) => safeWrite(window.sessionStorage, key, null),
}

export const localStore = {
  read: (key) => safeRead(window.localStorage, key),
  write: (key, value) => safeWrite(window.localStorage, key, value),
  remove: (key) => safeWrite(window.localStorage, key, null),
}

/** True when localStorage is actually writable (Safari private mode blocks it). */
export function isPersistentStorageAvailable() {
  try {
    const probe = '__fileshelf_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}
