import { useCallback, useEffect, useMemo, useState } from 'react'
import { normaliseCatalogue, collectCategories, summariseCatalogue, sortCatalogue } from '../lib/catalogue.js'

/**
 * Loads the catalogue.
 *
 * `src/data/files.json` is imported dynamically, which keeps it out of the main
 * bundle and gives the UI a genuine loading → ready/error lifecycle instead of a
 * fake spinner.
 */
export function useCatalogue() {
  const [state, setState] = useState({ status: 'loading', entries: [], error: null })

  const load = useCallback(async () => {
    setState({ status: 'loading', entries: [], error: null })
    try {
      const module = await import('../data/files.json')
      const entries = normaliseCatalogue(module.default ?? module)
      setState({ status: 'ready', entries, error: null })
    } catch (error) {
      setState({
        status: 'error',
        entries: [],
        error:
          error?.message ??
          'The catalogue could not be read. Check that src/data/files.json is valid JSON.',
      })
    }
  }, [])

  useEffect(() => {
    // `load` owns the error handling; nothing to await here.
    load()
  }, [load])

  const categories = useMemo(() => collectCategories(state.entries), [state.entries])
  const summary = useMemo(() => summariseCatalogue(state.entries), [state.entries])
  const ordered = useMemo(() => sortCatalogue(state.entries, 'newest'), [state.entries])

  return { ...state, entries: ordered, rawEntries: state.entries, categories, summary, reload: load }
}
