import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// FileShelf build config.
// - `public/files/**` is copied verbatim into the build output, which is how the
//   static downloads reach the browser (no backend involved).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Dev-server host allowlist. `true` keeps the app usable from containers,
    // LAN devices and hosted preview URLs; tighten it to a list of hostnames
    // (e.g. ['.your-domain.com']) when you want DNS-rebinding protection.
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
