import { PublishWorkflow } from '../../components/admin/PublishWorkflow.jsx'
import { Callout, CalloutList } from '../../components/Callout.jsx'
import { Card, SectionLabel } from '../../components/ui.jsx'
import { CodeBlock } from '../../components/CodeBlock.jsx'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR } from '../../lib/constants.js'

/** PublishTab — the complete, honest description of how a file reaches the site. */
export function PublishTab() {
  return (
    <div className="space-y-6">
      <PublishWorkflow />

      <Card className="space-y-4 p-5">
        <SectionLabel>Repository layout this workflow assumes</SectionLabel>
        <CodeBlock
          title="project tree"
          code={`fileshelf/
├─ public/
│  └─ files/                     ← downloadable bytes live here
│     ├─ dsa-notes.pdf
│     ├─ cloud-computing.pptx
│     └─ project-source.zip
├─ src/
│  ├─ data/
│  │  └─ files.json              ← the catalogue (what the library renders)
│  ├─ components/
│  ├─ pages/
│  └─ lib/
├─ vercel.json                   ← SPA fallback so /file/:id works on refresh
└─ vite.config.js`}
        />
        <Callout tone="info" title="Why no API or database is needed">
          <CalloutList
            items={[
              <>
                Vite copies everything in <span className="font-mono text-xs">public/</span> into the build output, so{' '}
                <span className="font-mono text-xs">{PUBLIC_FILES_DIR}dsa-notes.pdf</span> becomes a real URL on the
                deployed site.
              </>,
              <>
                The catalogue is bundled with the app, so the library renders from <span className="font-mono text-xs">{CATALOGUE_PATH}</span>{' '}
                with no fetch, no query and no server.
              </>,
              'Downloads are ordinary same-origin links, which is why they work with the browser’s own download manager.',
            ]}
          />
        </Callout>
      </Card>

      <Card className="space-y-3 p-5">
        <SectionLabel>Troubleshooting</SectionLabel>
        <CalloutList
          items={[
            <>
              <strong>Download gives a 404.</strong> The filename in the catalogue does not match the file in{' '}
              {PUBLIC_FILES_DIR} — check spelling, case and extension.
            </>,
            <>
              <strong>The card appears but the file will not open.</strong> The file was committed but the deploy has not
              finished; check the Vercel Deployments tab.
            </>,
            <>
              <strong>A refresh on /file/&lt;id&gt; shows "Page not found".</strong> The SPA rewrite in{' '}
              <span className="font-mono text-xs">vercel.json</span> is missing — static files must be served first, then
              everything else falls back to index.html.
            </>,
            <>
              <strong>The change is not visible on the live site.</strong> Vercel builds from the connected branch; a
              commit pushed to a different branch will not update production.
            </>,
            <>
              <strong>A removed file is still reachable.</strong> The entry was deleted but the asset still exists at{' '}
              <span className="font-mono text-xs">{PUBLIC_FILES_DIR}&lt;file&gt;</span> — delete the file too, and
              remember URLs may stay in caches.
            </>,
          ]}
        />
      </Card>
    </div>
  )
}
