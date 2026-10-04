import { Link, NavLink } from 'react-router-dom'
import { LayoutGrid, Lock, ShieldAlert } from 'lucide-react'
import { cx } from '../lib/cx.js'
import { useAdmin } from '../context/AdminContext.jsx'

const NAV_LINKS = [{ to: '/', label: 'Library', end: true }]

/** Marketing-free top bar: brand, nav links and the admin entry point. */
export function Navbar() {
  const { isAuthenticated, entries } = useAdmin()
  // Deep-link to a real entry rather than a hard-coded path, so removing a file
  // from the catalogue can never leave a dead link in the header.
  const featured = entries.find((entry) => entry.fileType === 'pdf') ?? entries[0] ?? null

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="FileShelf home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutGrid className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-slate-900">FileShelf</span>
            <span className="block text-[11px] text-slate-500">Static file library</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {featured ? (
            <NavLink
              to={`/file/${featured.id}`}
              className={({ isActive }) =>
                cx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              Featured file
            </NavLink>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset sm:inline-flex">
              <ShieldAlert className="size-3.5" aria-hidden="true" />
              Admin session active
            </span>
          ) : null}
          <Link
            to="/admin"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Lock className="size-4" aria-hidden="true" />
            Admin
          </Link>
        </div>
      </div>
    </header>
  )
}
