import JSZip from 'jszip'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR } from './constants.js'
import { serialiseCatalogue } from './catalogue.js'
import { formatBytes, slugify, todayISO } from './fileUtils.js'

/**
 * Local packaging only.
 *
 * These functions run entirely in the browser. They produce a ZIP file that the
 * user saves to their own machine, opens, and copies into the project before
 * committing. Nothing here uploads, deploys or writes to the project folder —
 * a web page cannot do that, and FileShelf never pretends otherwise.
 */

/* -------------------------------------------------------------------------- */
/* Instruction text bundled into every package                                 */
/* -------------------------------------------------------------------------- */

export function buildPackageReadme({ entries, includesFiles, note }) {
  const hasFiles = includesFiles && entries.length > 0
  const fileList = entries
    .map((entry) => `   - ${PUBLIC_FILES_DIR}${entry.filename}   (${formatBytes(entry.size)}, ${entry.category})`)
    .join('\n')

  return `FileShelf export package
Generated: ${new Date().toISOString()}
================================================================

This archive was created in your browser by the FileShelf admin page.
It is a local export. Nothing was uploaded, and your live site has
NOT changed yet. Follow the steps below to publish it.

WHAT IS IN THIS ARCHIVE
----------------------------------------------------------------
${hasFiles ? `public/files/\n${fileList}` : 'src/data/files.json   (catalogue only — no new file included)'}
src/data/files.json      full updated catalogue
catalogue-entry.json     just the new/changed entr${entries.length === 1 ? 'y' : 'ies'}, for manual edits
${note ? `\nNOTE: ${note}\n` : ''}
HOW TO PUBLISH
----------------------------------------------------------------
1. Unzip this archive.
2. ${hasFiles ? `Copy the file(s) listed above into your project's ${PUBLIC_FILES_DIR} folder.` : `Skip this step — this package contains no new file.`}
3. Replace ${CATALOGUE_PATH} in your project with the version in this archive.
4. Check it locally:  npm run dev
5. Commit and push:
       git add ${PUBLIC_FILES_DIR} ${CATALOGUE_PATH}
       git commit -m "content: add ${entries.map((e) => e.filename).join(', ') || 'catalogue update'}"
       git push
6. Let Vercel finish the automatic redeploy (Deployments tab).
7. Open the live site and confirm the download works.

Recorded on ${todayISO()}
================================================================
`
}

export function buildCatalogueOnlyReadme(entries) {
  return buildPackageReadme({ entries, includesFiles: false })
}

/* -------------------------------------------------------------------------- */
/* ZIP builders                                                                */
/* -------------------------------------------------------------------------- */

function packageFilename(label) {
  return `fileshelf-${slugify(label) || 'export'}-${todayISO()}.zip`
}

/**
 * Packages one selected file together with the updated catalogue.
 *
 * @param {object}   options
 * @param {File}     options.file            the file the admin selected
 * @param {object}   options.entry           catalogue entry for that file
 * @param {object[]} options.catalogue       the full updated catalogue
 * @param {boolean}  [options.includeFile]   false for a catalogue-only export
 * @returns {Promise<{blob: Blob, filename: string, contents: string[]}>}
 */
export async function createExportPackage({ file, entry, catalogue, includeFile = true }) {
  const zip = new JSZip()
  const contents = []

  if (includeFile && file) {
    // Stored inside the same relative path the project uses, so unzipping over
    // the project root lands the file in the right place.
    zip.file(`${PUBLIC_FILES_DIR}${entry.filename}`, file)
    contents.push(`${PUBLIC_FILES_DIR}${entry.filename}`)
  }

  zip.file(CATALOGUE_PATH, serialiseCatalogue(catalogue))
  contents.push(CATALOGUE_PATH)

  zip.file('catalogue-entry.json', `${JSON.stringify(entry, null, 2)}\n`)
  contents.push('catalogue-entry.json')

  zip.file(
    'README-FILESHELF.txt',
    buildPackageReadme({
      entries: includeFile && file ? [entry] : [],
      includesFiles: includeFile,
    }),
  )
  contents.push('README-FILESHELF.txt')

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return { blob, filename: packageFilename(entry.title || entry.filename), contents }
}

/**
 * Packages catalogue changes only (adds, edits and removals) — used after
 * managing entries in the catalogue tab, so no file bytes need to move.
 */
export async function createCataloguePackage({ catalogue, summary }) {
  const zip = new JSZip()

  zip.file(CATALOGUE_PATH, serialiseCatalogue(catalogue))
  zip.file(
    'README-FILESHELF.txt',
    buildCatalogueOnlyReadme([]).replace(
      'src/data/files.json   (catalogue only — no new file included)',
      'src/data/files.json   (catalogue only — no new file included)\n\n'
        + 'CHANGE SUMMARY\n----------------------------------------------------------------\n'
        + (summary?.lines?.map((line) => `   ${line}`).join('\n') ?? '   (no changes recorded)'),
    ),
  )
  zip.file('catalogue.json', serialiseCatalogue(catalogue))

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return {
    blob,
    filename: `fileshelf-catalogue-${todayISO()}.zip`,
    contents: [CATALOGUE_PATH, 'catalogue.json', 'README-FILESHELF.txt'],
  }
}

/* -------------------------------------------------------------------------- */
/* Plain-text instruction sheet for the selected file                          */
/* -------------------------------------------------------------------------- */

export function buildManualInstructions({ entries, includesFiles }) {
  return buildPackageReadme({ entries, includesFiles })
}
