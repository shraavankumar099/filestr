# FileShelf

A **frontend-only file library**. Files live in `public/files/`, the catalogue lives in
`src/data/files.json`, and the admin panel is a **local packaging and catalogue-generation tool** — it
builds a ZIP you save, copy into the project and commit. There is no database, no storage SDK, no API
key, no serverless function and no backend of any kind.

---

## What this project is — and what it is not

| ✅ It is | ❌ It is not |
| --- | --- |
| A static React app whose downloads are ordinary files in `public/files/` | An upload service — a browser cannot write to your project or your repository |
| A searchable, filterable, sortable public library rendered from one JSON file | A database or CMS |
| An admin tool that *packages* a file + updated catalogue into a ZIP | A backend that publishes changes for you |
| A demonstration of demo-password gating, with the limits stated plainly | Real access control — **everything in `public/files/` is public** |

> A browser has no ability to modify your project folder or your deployed site. FileShelf never claims
> otherwise: the admin page produces a ZIP, and **you** commit it.

---

## Tech stack

- **React 19** + **Vite** (JavaScript, no TypeScript)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **React Router** (`/`, `/file/:id`, `/admin`, `/admin/sign-in`)
- **Lucide React** icons
- **JSZip** — the only runtime dependency beyond React/Router/Lucide, used to build the export archive
- Deployable to **Vercel** as a static site

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run preview    # serve the build locally on :4173
```

No environment variables, no accounts, no keys. Nothing to configure.

---

## Project structure

```
fileshelf/
├─ public/
│  ├─ favicon.svg
│  └─ files/                     ← the downloadable bytes live here
│     ├─ dsa-notes.pdf
│     ├─ cloud-computing.pptx
│     ├─ machine-learning-basics.pptx
│     ├─ project-source.zip
│     ├─ react-18-cheatsheet.pdf
│     ├─ sql-query-reference.pdf
│     ├─ git-workflow-guide.pdf
│     ├─ ui-design-checklist.pdf
│     └─ internship-report-template.docx
├─ src/
│  ├─ components/
│  │  ├─ admin/                  ← FileDropzone, EntryForm, CatalogueTable, PublishWorkflow, …
│  │  ├─ ui.jsx                  ← Button, Card, Field, Badge, SegmentedControl
│  │  ├─ Callout.jsx             ← info / warning / danger / success notices
│  │  ├─ CodeBlock.jsx           ← copyable command blocks
│  │  ├─ DownloadButton.jsx
│  │  ├─ FileCard.jsx            ← grid card + list row
│  │  ├─ FilterBar.jsx           ← category chips, type filter, sorting, view toggle
│  │  ├─ Footer.jsx / Layout.jsx / Navbar.jsx
│  │  ├─ SearchBar.jsx
│  │  └─ StatusStates.jsx        ← loading, empty, no-results, error, not-found
│  ├─ context/AdminContext.jsx   ← demo session + staged (uncommitted) catalogue changes
│  ├─ data/files.json            ← the catalogue
│  ├─ hooks/                     ← useCatalogue, useObjectUrl
│  ├─ lib/
│  │  ├─ catalogue.js            ← normalise, filter, sort, serialise
│  │  ├─ constants.js            ← paths, limits, file-type map, demo password
│  │  ├─ exportPackage.js        ← builds the ZIP and its instructions
│  │  ├─ fileUtils.js            ← formatting, filename safety, validation
│  │  └─ storage.js              ← localStorage / sessionStorage wrappers
│  ├─ pages/
│  │  ├─ LibraryPage.jsx         ← public library
│  │  ├─ FileDetailPage.jsx      ← /file/:id
│  │  ├─ NotFoundPage.jsx
│  │  └─ admin/                  ← AdminPage + PackageTab, CatalogueTab, PublishTab, AdminSignInPage
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ scripts/generate-sample-files.py   ← optional: regenerates the demo files + catalogue
├─ vercel.json                        ← SPA fallback (static files served first)
└─ vite.config.js
```

---

## 1. File storage

Two places, both inside the repository:

| Concern | Location | Notes |
| --- | --- | --- |
| The bytes | `public/files/` | Vite copies this folder verbatim into `dist/`, so `public/files/dsa-notes.pdf` is served at `/files/dsa-notes.pdf` |
| The metadata | `src/data/files.json` | Bundled with the app; the library renders straight from it |

Downloads are plain same-origin links:

```html
<a href="/files/dsa-notes.pdf" download="dsa-notes.pdf">Download</a>
```

### Catalogue schema

```json
{
  "id": "dsa-notes",
  "title": "Data Structures & Algorithms — Revision Notes",
  "filename": "dsa-notes.pdf",
  "description": "Condensed revision notes covering arrays, trees and graphs.",
  "category": "Notes",
  "fileType": "pdf",
  "size": 418304,
  "url": "/files/dsa-notes.pdf",
  "addedAt": "2026-03-12"
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable identifier used by `/file/:id`. Derived from the filename when the admin creates an entry. |
| `title` | string | Heading shown on the card and detail page. |
| `filename` | string | Must match the file in `public/files/` **exactly**. |
| `description` | string | One or two sentences. |
| `category` | string | Drives the filter chips. |
| `fileType` | string | Lowercase extension (`pdf`, `pptx`, `zip`, …); selects the icon and type label. |
| `size` | number | Bytes. Formatted for display; shown verbatim on the detail page. |
| `url` | string | Relative static URL — always `/files/<filename>`. |
| `addedAt` | string | `YYYY-MM-DD`, used by date sorting. |

Rules that keep the library consistent:

1. `filename` and `url` must describe the same file — a mismatch produces a download that 404s.
2. Filenames should be lowercase and hyphenated; the admin normalises names for you.
3. Add the file and its catalogue entry **in the same commit**, or the card links to a missing file for
   one deploy.
4. Removing an entry does not remove the file — delete the file too, otherwise its URL stays public.

---

## 2. Public library (`/`)

- Every catalogue entry rendered as a responsive card (or a denser list row).
- **Search** across title, filename, description **and** category — multiple words are ANDed
  (`graph notes` finds the DSA notes).
- **Category chips**, a **file-type filter** and seven **sort orders** (newest, oldest, title A–Z/Z–A,
  largest, smallest, file type).
- Grid ⇄ list view toggle.
- A working **Download** button on every card, plus a **Copy link** button and an inline PDF preview on
  the detail page.
- Real states: loading skeleton while the catalogue module loads, empty library, no search results
  (naming the active filters), catalogue read error with retry, and a 404 for unknown routes and
  unknown file ids.

---

## 3. Admin panel (`/admin`)

Three tabs:

**Package a file** — the file-selection control and metadata form.

| Element | Behaviour |
| --- | --- |
| Drop zone / browse | Reads a local file with the File API; nothing is transmitted |
| Preview panel | Inline preview for images, video, audio, PDF and text; file size, MIME type and last-modified |
| Title, category, filename, description | Category offers the existing list or a new one; filename auto-normalises (`My Notes.pdf` → `my-notes.pdf`) |
| Validation | Errors block export: empty file, >25 MB, missing extension, unsafe filename, duplicate filename, missing title/category. Warnings (unusual extension, very short title) do not |
| Catalogue entry preview | The exact JSON object that will be written into `files.json`, plus the full updated catalogue |
| Export | `.zip` package, or `files.json` on its own |

**Catalogue** — management view over all entries:

- Filter by text or category; staged-status badges (`In catalogue`, `Staged · new`, `Staged · edited`).
- **Edit** opens an inline form; **Remove** asks for confirmation and reminds you to delete the file too.
  Removals are listed with an **Undo** control.
- A staged-change summary (`+ added`, `~ edited`, `- removed`) and a **Discard staged changes** button.
- Raw JSON panel showing exactly what gets exported, with copy-to-clipboard.
- Export the catalogue as a ZIP or a bare `files.json`.

**Publish to live** — the full workflow below, the repository layout, and troubleshooting.

### What the export produces

`fileshelf-<slug>-<date>.zip`

```
README-FILESHELF.txt                 instructions, repeated inside the archive
public/files/<filename>              the selected file, at the path the project expects
src/data/files.json                  the complete updated catalogue
catalogue-entry.json                 just the new entry, for hand-editing
```

The archive mirrors the project structure, so it can also be unzipped over the project root.

---

## 4. Admin access — and its limits

Demo password: **`fileshelf-admin`** (change `DEMO_ADMIN_PASSWORD` in `src/lib/constants.js`).

The sign-in screen, the admin dashboard and the README all state the same thing:

- **The password is not secret.** It is compiled into the client bundle and readable by anyone with
  developer tools. It hides the admin *interface*; it protects nothing.
- **The files are public.** Everything in `public/files/` is a static asset served from the CDN.
  Anyone with the URL can download it; crawlers can discover it. Never publish confidential,
  licensed or personal data here.
- **The session is per-tab.** It is kept in `sessionStorage` and disappears when the tab closes.
- **Staged changes are local.** They live in `localStorage` until you export and commit; clearing site
  data discards them.

If you need real protection, use host-level features instead of frontend code: Vercel
**Deployment Protection** / password protection, a private repository with a private deployment, or an
authenticated storage service (which would mean adding a backend — deliberately out of scope here).

---

## 5. Publishing workflow

The exact sequence from "I picked a file" to "it is on the live site":

1. **Select a file** in the admin interface (drag & drop or browse) and fill in title, description and
   category. Check the preview and the validation panel.
2. **Export the package** — click *Download package (.zip)*. Your browser saves the ZIP; nothing is
   uploaded.
3. **Copy the file into `public/files/`** by unzipping the archive:

   ```bash
   unzip ~/Downloads/fileshelf-my-notes-2026-03-12.zip -d /tmp/fileshelf-export
   cp /tmp/fileshelf-export/public/files/my-notes.pdf public/files/
   ```

4. **Update `src/data/files.json`** — replace it with the copy from the archive (or paste the object
   from `catalogue-entry.json`).
5. **Commit and push to GitHub:**

   ```bash
   git add public/files/my-notes.pdf src/data/files.json
   git commit -m "content: add my-notes.pdf"
   git push origin main
   ```

6. **Let Vercel redeploy automatically** — watch the Deployments tab; a build this size takes seconds.
7. **The new file is available on the public website.** Verify the card appears and the download
   returns the exact bytes.

Prefer the GitHub web UI? Open `public/files/` → *Add file* → *Upload files*, commit, then edit
`src/data/files.json` and paste the entry. Two commits, same result.

### Deploying to Vercel

1. Push the repository to GitHub.
2. On Vercel: **Add New → Project → Import** the repository.
3. Framework preset **Vite** (auto-detected). Build command `npm run build`, output directory `dist`.
4. Deploy. `vercel.json` adds the SPA fallback so a refresh on `/file/:id` works:

   ```json
   {
     "routes": [
       { "handle": "filesystem" },
       { "src": "/.*", "dest": "/index.html" }
     ]
   }
   ```

   Static files are served first, so `/files/dsa-notes.pdf` is never swallowed by the rewrite.

Any static host works the same way — the app is just HTML, CSS, JS and files. Only the SPA rewrite
needs an equivalent setting (e.g. Netlify `_redirects`, GitHub Pages 404 fallback).

---

## 6. Design notes

- Clean and minimal: white surfaces, a single blue accent, thin borders, no gradients.
- Responsive: one column on phones, two on tablets, three from 1024 px; the list view compacts to
  stacked rows on small screens.
- Consistent file-type icons and colour-coded badges for PDF, presentations, spreadsheets, documents,
  text, data, code, archives, images, video and audio.
- Accessibility: labelled controls, `aria-pressed` chips, `aria-live` result counts, visible focus
  rings, keyboard-operable menus, and `prefers-reduced-motion` respected.
- Every state is designed, not just the happy path — loading, empty, no-results, error, 404, validation
  errors, warnings and export success.

---

## 7. Sample files

The repo ships with nine real, working assets so the library is not a mock-up:

| File | Type | Category |
| --- | --- | --- |
| `dsa-notes.pdf` | PDF, 9 sections | Notes |
| `cloud-computing.pptx` | 9 slides | Presentations |
| `machine-learning-basics.pptx` | 8 slides | Presentations |
| `project-source.zip` | Express task-API source + tests | Archives |
| `react-18-cheatsheet.pdf` | Reference sheet | Reference |
| `sql-query-reference.pdf` | Reference sheet | Reference |
| `git-workflow-guide.pdf` | Guide | Guides |
| `ui-design-checklist.pdf` | Checklist | Design |
| `internship-report-template.docx` | Editable template | Templates |

They are ordinary files — open, read and download them like any static asset. `src/data/files.json`
records their real byte sizes.

To regenerate them (optional):

```bash
pip install reportlab python-pptx python-docx
python3 scripts/generate-sample-files.py
```

The script builds the assets **and** rewrites `src/data/files.json` from the exact size of every file.

---

## 8. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Download 404s | `filename` in the catalogue does not match the file in `public/files/` — check case and extension |
| Card appears, file will not open | The commit landed but the deploy is still running — check Vercel's Deployments tab |
| Refresh on `/file/:id` shows "Page not found" | Missing SPA rewrite — see the `vercel.json` snippet above |
| Live site unchanged after exporting | The ZIP lives on your machine; nothing is published until you commit and push |
| File is visible but not searchable | Missing or empty `title` / `description` / `category` in the entry |
| Search finds nothing after adding a category | Categories are matched exactly — `Notes` ≠ `notes` |
| Changes vanished from the admin panel | Staged changes are per-browser; clearing site data or switching browsers loses them |
| Very large files | Keep files small (a few MB): they are committed to git and served from the same origin |

---

## 9. Scope

Deliberately **not** included, per the project brief: any database, ORM, migration, file-storage
service (S3, Drive, Firebase, Cloudinary, Supabase, …), API key, serverless/edge function, or backend
server. FileShelf stays a static site; the "backend" is git.
"# filestr" 
