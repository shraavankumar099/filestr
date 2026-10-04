import { Lock, ShieldAlert } from 'lucide-react'
import { Callout, CalloutList } from '../Callout.jsx'
import { DEMO_ADMIN_PASSWORD } from '../../lib/constants.js'

/**
 * SecurityNotice — the honest description of what this sign-in does and does
 * not do. It is shown on both the sign-in screen and the admin dashboard so the
 * limitation is impossible to miss.
 */
export function SecurityNotice({ compact = false }) {
  if (compact) {
    return (
      <Callout tone="danger" title="This password is not real security">
        <p>
          The demo password (<code className="rounded bg-red-100 px-1 font-mono text-xs">{DEMO_ADMIN_PASSWORD}</code>) is
          compiled into the JavaScript bundle and the sign-in flag only lives in your browser tab. Anyone can read it
          and anyone can reach <span className="font-mono text-xs">/admin</span>.
        </p>
      </Callout>
    )
  }

  return (
    <Callout tone="danger" title="Frontend-only protection — read before relying on it" icon={ShieldAlert}>
      <CalloutList
        tone="danger"
        items={[
          <>
            <strong>The demo password is public.</strong> It ships in the client bundle, so it can be read by anyone who
            opens developer tools. It hides the admin screen from casual visitors and nothing more.
          </>,
          <>
            <strong>Files in <span className="font-mono text-xs">public/files/</span> are public.</strong> Every file is a
            static asset served straight from the CDN. Search engines, direct URLs and crawlers can reach them with no
            sign-in at all. Never put confidential, licensed or personal data in this library.
          </>,
          <>
            <strong>This page cannot change your project or your live site.</strong> It has no backend and no storage
            service. It packages a ZIP for you to save, and you commit the contents yourself.
          </>,
          <>
            <strong>Staged changes are local.</strong> Edits sit in your browser&apos;s localStorage until you export the
            catalogue and commit it. Clearing site data discards them.
          </>,
          <>
            <strong>Need real access control?</strong> Use Vercel password protection or deployment protection, keep the
            files in a private repository, or move the bytes to an authenticated storage service — all of which are
            outside the scope of this frontend-only demo.
          </>,
        ]}
      />
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 p-3 text-xs text-red-900 ring-1 ring-red-200 ring-inset">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          Demo password for this build:{' '}
          <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono font-semibold">{DEMO_ADMIN_PASSWORD}</code> —
          change <span className="font-mono">DEMO_ADMIN_PASSWORD</span> in{' '}
          <span className="font-mono">src/lib/constants.js</span> if you want a different word. It still will not be
          secret.
        </p>
      </div>
    </Callout>
  )
}
