import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, LogIn } from 'lucide-react'
import { Button, Card, Field, SectionLabel, TextInput } from '../../components/ui.jsx'
import { Callout } from '../../components/Callout.jsx'
import { SecurityNotice } from '../../components/admin/SecurityNotice.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { DEMO_ADMIN_PASSWORD } from '../../lib/constants.js'

/**
 * Demo sign-in. The password is a constant in the bundle — this screen exists to
 * demonstrate the flow and to keep the admin UI out of the way, not to protect
 * anything. See SecurityNotice for the full explanation.
 */
export function AdminSignInPage() {
  const { signIn, isAuthenticated } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const redirectTo = location.state?.from ?? '/admin'

  function handleSubmit(event) {
    event.preventDefault()
    const result = signIn(password)
    if (result.ok) {
      navigate(redirectTo, { replace: true })
      return
    }
    setError(result.error)
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the library
        </Link>

        <div className="space-y-2">
          <SectionLabel>Admin panel</SectionLabel>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in to manage the catalogue</h1>
          <p className="text-sm text-slate-600">
            The admin panel packages a selected file together with updated catalogue JSON. It does not upload anything
            and it cannot modify this project or the deployed site.
          </p>
        </div>

        <Card className="space-y-5 p-6">
          {isAuthenticated ? (
            <Callout tone="success" title="You are already signed in">
              <Button onClick={() => navigate('/admin', { replace: true })}>Continue to the admin panel</Button>
            </Callout>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                label="Admin password"
                htmlFor="admin-password"
                error={error}
                hint={
                  <>
                    Demo password: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{DEMO_ADMIN_PASSWORD}</code>
                  </>
                }
              >
                <TextInput
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError(null)
                  }}
                  placeholder="Enter the demo password"
                  autoComplete="current-password"
                  invalid={Boolean(error)}
                  autoFocus
                />
              </Field>

              <Button type="submit" size="lg" className="w-full" disabled={password.length === 0}>
                <LogIn className="size-4" aria-hidden="true" />
                Sign in
              </Button>

              <p className="flex items-start gap-2 text-xs text-slate-500">
                <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                The session lives in this browser tab only and expires when the tab closes.
              </p>
            </form>
          )}
        </Card>
      </div>

      <SecurityNotice />
    </div>
  )
}
