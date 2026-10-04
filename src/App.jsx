import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { LibraryPage } from './pages/LibraryPage.jsx'
import { FileDetailPage } from './pages/FileDetailPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { AdminPage } from './pages/admin/AdminPage.jsx'
import { AdminSignInPage } from './pages/admin/AdminSignInPage.jsx'
import { AdminProvider, RequireAdmin } from './context/AdminContext.jsx'

/**
 * Routing:
 *   /            public library (search, filters, sorting, downloads)
 *   /file/:id    file detail
 *   /admin       admin panel (guarded by the demo sign-in)
 *   /admin/sign-in
 *   *            404
 *
 * The browser history router needs the SPA rewrite in vercel.json so a refresh on
 * /file/:id does not 404 on the host.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LibraryPage />} />
            <Route path="file/:fileId" element={<FileDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/sign-in" element={<AdminSignInPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminProvider>
    </BrowserRouter>
  )
}
