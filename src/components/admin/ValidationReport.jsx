import { CircleCheck, TriangleAlert, XCircle } from 'lucide-react'
import { Callout, CalloutList } from '../Callout.jsx'

/**
 * ValidationReport — the outcome of `validateSelection()` for the current file
 * and metadata. Errors block the export; warnings are advisories.
 */
export function ValidationReport({ errors, warnings, valid, label = 'the selected file' }) {
  if (valid && warnings.length === 0) {
    return (
      <Callout tone="success" title="Ready to export" icon={CircleCheck}>
        <p>
          {label} passed every check: supported type, within the size limit, a unique safe filename, and complete
          metadata.
        </p>
      </Callout>
    )
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 ? (
        <Callout tone="danger" title={`Fix ${errors.length} problem${errors.length === 1 ? '' : 's'} before exporting`}>
          <CalloutList tone="danger" items={errors} />
        </Callout>
      ) : null}

      {warnings.length > 0 ? (
        <Callout
          tone="warning"
          title={`${warnings.length} advisory note${warnings.length === 1 ? '' : 's'} — export is still allowed`}
          icon={TriangleAlert}
        >
          <CalloutList tone="warning" items={warnings} />
        </Callout>
      ) : null}

      {valid ? (
        <Callout tone="success" title="No blocking problems" icon={CircleCheck}>
          <p>The file and metadata can be packaged.</p>
        </Callout>
      ) : (
        <Callout tone="info" title="Export unavailable" icon={XCircle}>
          <p>The ZIP button stays disabled until every error above is resolved.</p>
        </Callout>
      )}
    </div>
  )
}
