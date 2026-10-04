import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, LogOut, Package, Rocket } from 'lucide-react'
import { Badge, Button, Card, SectionLabel } from '../../components/ui.jsx'
import { SecurityNotice } from '../../components/admin/SecurityNotice.jsx'
import { PackageTab } from './PackageTab.jsx'
import { CatalogueTab } from './CatalogueTab.jsx'
import { PublishTab } from './PublishTab.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR } from '../../lib/constants.js'
import { cx } from '../../lib/cx.js'

const TABS = [
  { id: 'package', label: 'Package a file', icon: Package },
  { id: 'catalogue', label: 'Catalogue', icon: ClipboardList },
  { id: 'publish', label: 'Publish to live', icon: Rocket },
]

/** Admin shell: session header, tab navigation and the three admin workspaces. */
export function AdminPage() {
  const { signOut, session, entries, catalogue, changeSummary } = useAdmin()
  const [tab, setTab] = useState('package')

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <SectionLabel>Admin panel</SectionLabel>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              FileShelf packaging &amp; catalogue tool
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Session started {session?.signedInAt ? new Date(session.signedInAt).toLocaleString() : 'just now'} ·{' '}
              {entries.length} catalogue entries
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {changeSummary.hasChanges ? (
              <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/20">
                {changeSummary.lines.length} staged change{changeSummary.lines.length === 1 ? '' : 's'}
              </Badge>
            ) : (
              <Badge>Nothing staged</Badge>
            )}
            <Button as={Link} to="/" variant="secondary" size="sm" className="h-9">
              View public library
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9" onClick={signOut}>
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Admin sections">
            {TABS.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                  {item.id === 'catalogue' && changeSummary.hasChanges ? (
                    <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
                      {changeSummary.lines.length}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="flex flex-wrap items-center gap-4 border-slate-200 bg-white p-4">
          <div className="min-w-0 flex-1 text-xs text-slate-600">
            <p className="font-medium text-slate-900">Local tool — not an upload server</p>
            <p className="mt-1">
              This page reads files from your machine and writes a ZIP to your downloads folder. Bytes go to{' '}
              <span className="font-mono">{PUBLIC_FILES_DIR}</span> and metadata to{' '}
              <span className="font-mono">{CATALOGUE_PATH}</span> only after you commit them yourself.
            </p>
          </div>
          {catalogue.status === 'error' ? (
            <Badge tone="bg-red-50 text-red-700 ring-red-600/20">Catalogue failed to load</Badge>
          ) : (
            <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
              {catalogue.status === 'loading' ? 'Loading catalogue…' : 'Catalogue loaded'}
            </Badge>
          )}
        </Card>

        <SecurityNotice compact />

        {tab === 'package' ? <PackageTab onGoToPublish={() => setTab('publish')} /> : null}
        {tab === 'catalogue' ? <CatalogueTab onGoToPackage={() => setTab('package')} /> : null}
        {tab === 'publish' ? <PublishTab /> : null}
      </div>
    </div>
  )
}
