import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui.jsx'
import { NotFoundState } from '../components/StatusStates.jsx'

/** 404 route — always offers a way back. */
export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <NotFoundState
        title="Page not found"
        description="That route does not exist. The library homepage lists every file in the catalogue."
        action={
          <Button as={Link} to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go to the library
          </Button>
        }
      />
    </div>
  )
}
