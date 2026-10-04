import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Download,
  FileJson,
  Package,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Button, Card, Checkbox, SectionLabel } from '../../components/ui.jsx'
import { Callout, CalloutList } from '../../components/Callout.jsx'
import { CodeBlock } from '../../components/CodeBlock.jsx'
import { FileDropzone } from '../../components/admin/FileDropzone.jsx'
import { FilePreviewPanel } from '../../components/admin/FilePreviewPanel.jsx'
import { EntryForm } from '../../components/admin/EntryForm.jsx'
import { ValidationReport } from '../../components/admin/ValidationReport.jsx'
import { InstructionSteps } from '../../components/admin/InstructionSteps.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { CATALOGUE_PATH, DEFAULT_CATEGORIES, PUBLIC_FILES_DIR } from '../../lib/constants.js'
import { buildEntry, serialiseCatalogue, upsertEntry } from '../../lib/catalogue.js'
import {
  normaliseFilename,
  isPlainFilename,
  formatBytes,
  slugify,
  todayISO,
  downloadBlob,
  downloadText,
  validateSelection,
} from '../../lib/fileUtils.js'
import { createExportPackage } from '../../lib/exportPackage.js'

const EMPTY_METADATA = { title: '', description: '', category: '', filename: '' }

/**
 * PackageTab — select a file, describe it, validate it, and export a ZIP that
 * contains the file plus the updated catalogue. Everything happens locally.
 */
export function PackageTab({ onGoToPublish }) {
  const { entries, catalogue, addEntry } = useAdmin()
  const [file, setFile] = useState(null)
  const [metadata, setMetadata] = useState(EMPTY_METADATA)
  const [touched, setTouched] = useState(false)
  const [includeFile, setIncludeFile] = useState(true)
  const [addToStaged, setAddToStaged] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [exportError, setExportError] = useState(null)

  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...catalogue.categories.map((item) => item.name)])
    for (const entry of entries) set.add(entry.category)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [catalogue.categories, entries])

  /* Validation runs on every change; the export button uses `valid`. */
  const validation = useMemo(
    () =>
      validateSelection(
        {
          file,
          title: metadata.title,
          category: metadata.category,
          filename: metadata.filename,
        },
        entries,
      ),
    [entries, file, metadata],
  )

  /* Field-level messages shown inline in the form. */
  const fieldErrors = useMemo(() => {
    if (!file) return {}
    const targetName = (metadata.filename.trim() || file.name)
    const map = {}
    if (!metadata.title.trim()) map.title = 'A title is required — it is the heading visitors see.'
    if (!metadata.category.trim()) map.category = 'Pick a category so the file can be filtered.'
    if (entries.some((entry) => entry.filename === targetName)) {
      map.filename = `"${targetName}" is already in the catalogue.`
    } else if (!isPlainFilename(targetName)) {
      map.filename = 'Use a plain filename with no folders or leading dots.'
    }
    return map
  }, [entries, file, metadata.category, metadata.filename, metadata.title])

  /* The catalogue entry that will be written into files.json. */
  const draftEntry = useMemo(() => {
    if (!file) return null
    return buildEntry({
      title: metadata.title.trim() || file.name,
      filename: metadata.filename.trim() || normaliseFilename(file.name),
      description: metadata.description.trim(),
      category: metadata.category.trim() || 'Other',
      size: file.size,
      addedAt: todayISO(),
    })
  }, [file, metadata])

  /* What files.json will look like after this entry is appended. */
  const updatedCatalogue = useMemo(
    () => (draftEntry ? upsertEntry(entries, draftEntry) : entries),
    [draftEntry, entries],
  )

  function handleSelectFile(picked) {
    setResult(null)
    setExportError(null)
    setFile(picked)
    setMetadata((current) => ({
      ...current,
      filename: normaliseFilename(picked.name),
      title: current.title || picked.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      category: current.category || categoryOptions[0] || 'Other',
    }))
  }

  function handleReset() {
    setFile(null)
    setMetadata(EMPTY_METADATA)
    setTouched(false)
    setResult(null)
    setExportError(null)
  }

  async function handleExport() {
    if (!draftEntry || !file) return
    setTouched(true)
    setBusy(true)
    setExportError(null)
    try {
      const packaged = await createExportPackage({
        file,
        entry: draftEntry,
        catalogue: updatedCatalogue,
        includeFile,
      })
      downloadBlob(packaged.blob, packaged.filename)
      if (addToStaged) addEntry(draftEntry)
      setResult({ ...packaged, entry: draftEntry, sizeBytes: packaged.blob.size, staged: addToStaged })
    } catch (error) {
      setExportError(error?.message ?? 'The package could not be built in this browser.')
    } finally {
      setBusy(false)
    }
  }

  function handleDownloadCatalogue() {
    downloadText(serialiseCatalogue(updatedCatalogue), 'files.json')
  }

  const entryJson = draftEntry ? `${JSON.stringify(draftEntry, null, 2)}\n` : ''

  return (
    <div className="space-y-6">
      <Callout tone="warning" title="Export only — this page cannot publish for you" icon={ShieldAlert}>
        <CalloutList
          tone="warning"
          items={[
            'A browser cannot write to your project folder, your repository or your deployed site. This page builds a package you save yourself.',
            <>
              You must still copy the file into <span className="font-mono text-xs">{PUBLIC_FILES_DIR}</span> and replace{' '}
              <span className="font-mono text-xs">{CATALOGUE_PATH}</span>, then commit and push. The full sequence is on the{' '}
              <button type="button" onClick={onGoToPublish} className="font-medium underline">
                Publish to live
              </button>{' '}
              tab.
            </>,
            'Until that commit lands, the live website shows the previous catalogue — no file appears "uploaded".',
          ]}
        />
      </Callout>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: selection + metadata */}
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>1 · Select a file</SectionLabel>
              {file ? (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reset form
                </Button>
              ) : null}
            </div>
            <FileDropzone
              file={file}
              onSelect={handleSelectFile}
              onClear={handleReset}
              invalid={touched && Boolean(validation.errors.length)}
            />
          </Card>

          <Card className="space-y-4 p-5">
            <SectionLabel>2 · Describe the file</SectionLabel>
            <EntryForm
              values={metadata}
              onChange={setMetadata}
              errors={touched ? fieldErrors : {}}
              categories={categoryOptions}
              disabled={!file}
            />
            <p className="text-xs text-slate-500">
              Entries are appended to the end of the catalogue array. Field values are written verbatim, so keep
              filenames lowercase and hyphenated.
            </p>
          </Card>
        </div>

        {/* Right: preview, validation, export */}
        <div className="space-y-6">
          <div>
            <SectionLabel className="mb-3">3 · Preview and validate</SectionLabel>
            <div className="space-y-4">
              <FilePreviewPanel file={file} title={metadata.title} />
              {file ? (
                <ValidationReport errors={validation.errors} warnings={validation.warnings} valid={validation.valid} />
              ) : (
                <Callout tone="info" title="Waiting for a file">
                  <p className="text-xs">
                    Validation checks the size, the extension, the filename safety and duplicates against the current
                    catalogue.
                  </p>
                </Callout>
              )}
            </div>
          </div>

          <Card className="space-y-4 p-5">
            <SectionLabel>4 · Export the package</SectionLabel>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Checkbox
                checked={includeFile}
                onChange={(event) => setIncludeFile(event.target.checked)}
                label={
                  <>
                    <span className="font-medium">Include the selected file in the ZIP</span>
                    <span className="block text-xs text-slate-500">
                      Recommended: the ZIP then mirrors your project structure and can be unzipped over the project root.
                    </span>
                  </>
                }
              />
              <Checkbox
                checked={addToStaged}
                onChange={(event) => setAddToStaged(event.target.checked)}
                label={
                  <>
                    <span className="font-medium">Also add this entry to the staged catalogue</span>
                    <span className="block text-xs text-slate-500">
                      Keeps the Catalogue tab in sync and includes it in later catalogue exports.
                    </span>
                  </>
                }
              />
              {file ? (
                <p className="border-t border-slate-200 pt-3 text-xs text-slate-600">
                  Uncompressed contents up to{' '}
                  {formatBytes((includeFile ? file.size : 0) + serialiseCatalogue(updatedCatalogue).length + 1500)} ·{' '}
                  {includeFile ? '1 file + full catalogue' : 'catalogue only'} · the ZIP is smaller once compressed
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleExport}
                disabled={!validation.valid || busy}
                className="grow justify-center"
              >
                <Package className="size-4" aria-hidden="true" />
                {busy ? 'Building package…' : 'Download package (.zip)'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleDownloadCatalogue}
                disabled={!draftEntry || busy}
                title="Download only the updated files.json"
              >
                <FileJson className="size-4" aria-hidden="true" />
                files.json only
              </Button>
            </div>

            {!validation.valid && touched ? (
              <p className="text-xs text-red-600">
                Resolve the errors listed above to enable the export button.
              </p>
            ) : null}

            {exportError ? (
              <Callout tone="danger" title="Export failed">
                <p className="text-xs">{exportError}</p>
              </Callout>
            ) : null}

            {result ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Package downloaded: {result.filename}
                </p>
                <p className="text-xs text-emerald-800">
                  {formatBytes(result.sizeBytes)} · your browser saved it to the downloads folder.
                  {result.staged
                    ? ' The entry was also added to the staged catalogue in this browser.'
                    : ' The staged catalogue was left unchanged.'}
                </p>
                <div className="rounded-lg bg-white/70 p-3">
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-emerald-900 uppercase">
                    Inside the archive
                  </p>
                  <ul className="space-y-1 font-mono text-xs text-emerald-900">
                    {result.contents.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <InstructionSteps
                  className="text-emerald-900"
                  steps={[
                    {
                      title: `Copy ${result.entry.filename} into ${PUBLIC_FILES_DIR}`,
                      description: 'Unzip the archive first; it already contains the file at that path.',
                    },
                    {
                      title: `Replace ${CATALOGUE_PATH}`,
                      description: 'The archive has the complete updated catalogue, including your new entry.',
                    },
                    {
                      title: 'Commit, push and wait for the Vercel redeploy',
                      description: 'Then confirm the download on the live site.',
                    },
                  ]}
                />
                <Button variant="secondary" size="sm" onClick={onGoToPublish}>
                  See the full publishing workflow
                </Button>
              </div>
            ) : null}
          </Card>

          {draftEntry ? (
            <Card className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Catalogue entry that will be written</SectionLabel>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  id: {slugify(draftEntry.filename)}
                </span>
              </div>
              <CodeBlock title={`${CATALOGUE_PATH} — new entry`} code={entryJson} />
              <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-medium text-slate-700">
                  Preview the full updated catalogue ({updatedCatalogue.length} entries)
                </summary>
                <div className="mt-3">
                  <CodeBlock
                    title={`${CATALOGUE_PATH} — ${updatedCatalogue.length} entries`}
                    code={serialiseCatalogue(updatedCatalogue)}
                  />
                </div>
              </details>
            </Card>
          ) : null}

          <Callout tone="info" title="How large is too large?">
            <p className="text-xs">
              Files are committed to git, so keep them small — this build caps a single file at 25 MB and warns past a
              few MB. Very large assets belong in a storage service, which is deliberately outside FileShelf&apos;s
              scope.
            </p>
          </Callout>

          {catalogue.status === 'error' ? (
            <Callout tone="danger" title="The existing catalogue could not be read">
              <p className="text-xs">{catalogue.error}</p>
            </Callout>
          ) : null}
        </div>
      </div>
    </div>
  )
}
