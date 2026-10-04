import { Badge, Card, SectionLabel } from '../ui.jsx'
import { Callout, CalloutList } from '../Callout.jsx'
import { CodeBlock } from '../CodeBlock.jsx'
import { InstructionSteps } from './InstructionSteps.jsx'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR } from '../../lib/constants.js'

/**
 * PublishWorkflow — the exact, end-to-end route from "I picked a file" to
 * "it is on the live website". Nothing here happens automatically: the browser
 * produces a package, and a human commits it.
 */
export function PublishWorkflow({ filename = '<your-file>.pdf' }) {
  return (
    <div className="space-y-6">
      <Callout tone="brand" title="The whole workflow in one sentence">
        <p>
          The admin page packages the file and the updated catalogue into a ZIP. You unzip it, copy the file into{' '}
          <span className="font-mono text-xs">{PUBLIC_FILES_DIR}</span>, replace{' '}
          <span className="font-mono text-xs">{CATALOGUE_PATH}</span>, commit, push, and Vercel redeploys the site.
        </p>
      </Callout>

      <Card className="p-5 sm:p-6">
        <SectionLabel className="mb-5">Seven steps from local file to live download</SectionLabel>
        <InstructionSteps
          steps={[
            {
              title: 'Select a file in the admin interface',
              description:
                'Drag the file onto the drop zone or browse for it. It is read locally in your browser — nothing is transmitted. Fill in the title, description and category, then check the preview and validation panel.',
            },
            {
              title: 'Export the file and the updated catalogue',
              description:
                'Click “Download package”. Your browser saves a ZIP named fileshelf-<slug>-<date>.zip containing:',
              children: (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <ul className="space-y-1 font-mono text-xs text-slate-700">
                    <li>
                      {PUBLIC_FILES_DIR}
                      <span className="text-slate-500">{filename}</span>
                    </li>
                    <li>{CATALOGUE_PATH}</li>
                    <li>catalogue-entry.json <span className="font-sans text-slate-500">(the single new entry)</span></li>
                    <li>README-FILESHELF.txt <span className="font-sans text-slate-500">(these instructions again)</span></li>
                  </ul>
                </div>
              ),
            },
            {
              title: 'Copy the file into public/files/',
              description:
                'Unzip the archive and copy the file into your project. The ZIP already mirrors the project structure, so you can also unzip it over the project root.',
              children: (
                <CodeBlock
                  title="project root"
                  code={`unzip ~/Downloads/fileshelf-${filename.replace(/\.[a-z0-9]+$/i, '')}-2026-03-12.zip -d /tmp/fileshelf-export
cp "/tmp/fileshelf-export/${PUBLIC_FILES_DIR}${filename}" ${PUBLIC_FILES_DIR}
ls -l ${PUBLIC_FILES_DIR}${filename}`}
                />
              ),
            },
            {
              title: `Update ${CATALOGUE_PATH}`,
              description:
                'Either replace the whole file with the exported copy (recommended — it is already valid JSON) or paste the new object from catalogue-entry.json into the existing array, keeping the trailing comma rules in mind.',
              children: (
                <CodeBlock
                  title={`${CATALOGUE_PATH} — one entry`}
                  code={`{
  "id": "${filename.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}",
  "title": "Your file title",
  "filename": "${filename}",
  "description": "One or two sentences about the file.",
  "category": "Notes",
  "fileType": "${(filename.split('.').pop() || 'pdf').toLowerCase()}",
  "size": 418304,
  "url": "/files/${filename}",
  "addedAt": "2026-03-12"
}`}
                />
              ),
            },
            {
              title: 'Commit and push to GitHub',
              children: (
                <CodeBlock
                  title="git"
                  code={`git status
git add ${PUBLIC_FILES_DIR}${filename} ${CATALOGUE_PATH}
git commit -m "content: add ${filename}"
git push origin main`}
                />
              ),
            },
            {
              title: 'Let Vercel redeploy automatically',
              description:
                'Vercel is connected to the repository and rebuilds on every push to the production branch. Watch the Deployments tab; a static build of this size takes well under a minute.',
              children: (
                <Callout tone="info" title="If your project is not connected yet">
                  <p>
                    Import the repository at vercel.com → Add New → Project. Framework preset: Vite. Build command:{' '}
                    <span className="font-mono text-xs">npm run build</span>. Output directory:{' '}
                    <span className="font-mono text-xs">dist</span>. No environment variables are required.
                  </p>
                </Callout>
              ),
            },
            {
              title: 'The new file is available on the public website',
              children: (
                <Callout tone="success" title="Verify the download">
                  <p>
                    Open the deployed URL, find the file, and click Download. The browser should receive the exact bytes
                    you committed. You can also open{' '}
                    <span className="font-mono text-xs">https://your-site/files/{filename}</span> directly — that is the
                    same static asset.
                  </p>
                </Callout>
              ),
            },
          ]}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <SectionLabel>Prefer the GitHub web UI?</SectionLabel>
          <CalloutList
            items={[
              <>Open the repository → <span className="font-mono text-xs">public/files/</span> → Add file → Upload files, and drag the exported file in.</>,
              <>Commit the upload straight to <span className="font-mono text-xs">main</span>.</>,
              <>Then open <span className="font-mono text-xs">{CATALOGUE_PATH}</span>, edit it, and paste the entry from catalogue-entry.json.</>,
              <>Commit that change too. Vercel picks up both commits and redeploys.</>,
            ]}
          />
        </Card>

        <Card className="space-y-3 p-5">
          <SectionLabel>Good habits</SectionLabel>
          <CalloutList
            items={[
              <>Keep filenames lowercase, hyphenated and identical in three places: the file on disk, the <span className="font-mono text-xs">filename</span> field and the <span className="font-mono text-xs">url</span> field.</>,
              <>Add the file and the catalogue entry in the same commit, otherwise the card links to a 404 for one deploy.</>,
              <>Keep files small (a few MB). They are committed to git and served from the same origin as the app.</>,
              <>After a removal, delete the file from <span className="font-mono text-xs">public/files/</span> as well as the entry — a deleted entry leaves the URL reachable.</>,
            ]}
          />
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <SectionLabel>What this workflow is not</SectionLabel>
          <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/20">Important</Badge>
        </div>
        <CalloutList
          items={[
            <>It is <strong>not</strong> an upload. A browser cannot write into your project folder or your repository, and this app has no backend that could do it for you.</>,
            <>It does <strong>not</strong> change the deployed site. Until you commit and push, the live site keeps serving the previous catalogue.</>,
            <>It is <strong>not</strong> a database. The catalogue is one JSON file in the repository; git history is the audit trail.</>,
            <>It is <strong>not</strong> private. Everything you publish is publicly downloadable.</>,
          ]}
        />
      </Card>
    </div>
  )
}
