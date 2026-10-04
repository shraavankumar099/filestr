import { Link } from 'react-router-dom'
import { CATALOGUE_PATH, PUBLIC_FILES_DIR } from '../lib/constants.js'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">FileShelf</p>
          <p className="text-sm text-slate-600">
            A frontend-only file library. Files are static assets in the repository — no database, no
            storage service, no backend.
          </p>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-900">How files are stored</p>
          <p>
            Bytes: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{PUBLIC_FILES_DIR}</code>
          </p>
          <p>
            Catalogue: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{CATALOGUE_PATH}</code>
          </p>
          <p>Downloads are plain links such as /files/dsa-notes.pdf.</p>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Publishing</p>
          <p>
            The admin page packages a new file and an updated catalogue as a ZIP. You commit the result, then
            Vercel rebuilds the site.
          </p>
          <p>
            <Link to="/admin" className="font-medium text-blue-700 hover:text-blue-800 hover:underline">
              Open the admin panel →
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        Everything in <span className="font-mono">{PUBLIC_FILES_DIR}</span> is publicly downloadable by anyone who has the
        URL. Do not place private or confidential files in this library.
      </div>
    </footer>
  )
}
