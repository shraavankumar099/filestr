import { useMemo, useState } from 'react'
import { Check, Copy, Download, FileJson, Package, RotateCcw, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, SectionLabel } from '../../components/ui.jsx'
import { Callout, CalloutList } from '../../components/Callout.jsx'
import { CodeBlock } from '../../components/CodeBlock.jsx'
import { CatalogueTable } from '../../components/admin/CatalogueTable.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { CATALOGUE_PATH, DEFAULT_CATEGORIES, PUBLIC_FILES_DIR } from '../../lib/constants.js'
import { serialiseCatalogue } from '../../lib/catalogue.js'
import { copyToClipboard, downloadBlob, downloadText, formatBytes } from '../../lib/fileUtils.js'
import { createCataloguePackage } from '../../lib/exportPackage.js'

/**
 * CatalogueTab — the catalogue management view.
 *
 * Edits and removals are staged in this browser. Exporting produces a ZIP (or a
 * plain files.json) that you commit; only then does the change reach the site.
 */
export function CatalogueTab({ onGoToPackage }) {
  const { entries, staged, updateEntry, removeEntry, undoRemove, resetStaged, changeSummary } = useAdmin()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [lastExport, setLastExport] = useState(null)

  const json = useMemo(() => serialiseCatalogue(entries), [entries])

  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...entries.map((entry) => entry.category)])
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [entries])

  async function handleExportZip() {
    setBusy(true)
    try {
      const packaged = await createCataloguePackage({ catalogue: entries, summary: changeSummary })
      downloadBlob(packaged.blob, packaged.filename)
      setLastExport({ filename: packaged.filename, size: packaged.blob.size, contents: packaged.contents })
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    const ok = await copyToClipboard(json)
    setCopied(ok)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Callout tone="info" title="Edits here are staged in your browser only">
        <CalloutList
          items={[
            <>
              Nothing is written to <span className="font-mono text-xs">{CATALOGUE_PATH}</span> until you export it,
              replace the file in your project and commit.
            </>,
            <>
              Removing an entry from the catalogue does <strong>not</strong> delete{' '}
              <span className="font-mono text-xs">{PUBLIC_FILES_DIR}&lt;file&gt;</span>. Delete the file in your
              repository too, or the URL keeps working.
            </>,
            'Closing the tab keeps staged changes (they are in localStorage); clearing site data discards them.',
          ]}
        />
      </Callout>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <SectionLabel>Catalogue</SectionLabel>
            <p className="text-sm text-slate-600">
              {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · {formatBytes(entries.reduce((total, entry) => total + entry.size, 0))}{' '}
              of files · {new Set(entries.map((entry) => entry.category)).size} categories
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {changeSummary.hasChanges ? (
                <>
                  <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                    {changeSummary.counts.added} added
                  </Badge>
                  <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/20">
                    {changeSummary.counts.edited} edited
                  </Badge>
                  <Badge tone="bg-red-50 text-red-700 ring-red-600/20">
                    {changeSummary.counts.removed} removed
                  </Badge>
                </>
              ) : (
                <Badge>No staged changes</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportZip} disabled={busy}>
              <Package className="size-4" aria-hidden="true" />
              {busy ? 'Building…' : 'Export catalogue (.zip)'}
            </Button>
            <Button variant="secondary" onClick={() => downloadText(json, 'files.json')}>
              <FileJson className="size-4" aria-hidden="true" />
              files.json
            </Button>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
            <Button variant="secondary" onClick={onGoToPackage}>
              <Download className="size-4" aria-hidden="true" />
              Add a new file
            </Button>
          </div>
        </div>

        {changeSummary.hasChanges ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Staged change summary (included in the export)
            </p>
            <ul className="space-y-1 font-mono text-xs text-slate-700">
              {changeSummary.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {confirmReset ? (
                <>
                  <Button
                    variant="dangerSolid"
                    size="sm"
                    onClick={() => {
                      resetStaged()
                      setConfirmReset(false)
                    }}
                  >
                    Yes, discard staged changes
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Discard staged changes
                </Button>
              )}
              <span className="text-xs text-slate-500">
                Discarding restores the catalogue exactly as it is in {CATALOGUE_PATH}.
              </span>
            </div>
          </div>
        ) : null}

        {lastExport ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-900">
              Downloaded {lastExport.filename} ({formatBytes(lastExport.size)})
            </p>
            <p className="mt-1 font-mono text-xs text-emerald-800">{lastExport.contents.join(' · ')}</p>
            <p className="mt-2 text-xs text-emerald-800">
              Replace <span className="font-mono">{CATALOGUE_PATH}</span> in your project with the copy from this ZIP,
              then commit and push. See the <strong>Publish to live</strong> tab for the full sequence.
            </p>
          </div>
        ) : null}
      </Card>

      <CatalogueTable
        entries={entries}
        staged={staged}
        categories={categoryOptions}
        onUpdate={updateEntry}
        onRemove={removeEntry}
        onUndoRemove={undoRemove}
      />

      <Card className="space-y-3 p-5">
        <SectionLabel>Raw catalogue — exactly what gets exported</SectionLabel>
        <p className="text-xs text-slate-600">
          This is the literal text of <span className="font-mono">{CATALOGUE_PATH}</span> after your staged changes, with
          a trailing newline and 2-space indentation. Copying this file into the project is the whole &quot;database
          update&quot;.
        </p>
        <CodeBlock title={`${CATALOGUE_PATH} — ${entries.length} entries`} code={json} />
      </Card>

      <Callout tone="warning" title="Checklist before you commit" icon={TriangleAlert}>
        <CalloutList
          tone="warning"
          items={[
            <>
              Every <span className="font-mono text-xs">filename</span> in this JSON exists in {PUBLIC_FILES_DIR} — file
              and catalogue must be committed together.
            </>,
            <>
              Every <span className="font-mono text-xs">size</span> matches the real file (the admin sets it for
              packaged files; hand edits need checking).
            </>,
            <>
              Every <span className="font-mono text-xs">url</span> is exactly{' '}
              <span className="font-mono text-xs">/files/&lt;filename&gt;</span>.
            </>,
            'No duplicate ids or filenames — the export does not de-duplicate hand-made entries for you.',
          ]}
        />
      </Callout>
    </div>
  )
}
