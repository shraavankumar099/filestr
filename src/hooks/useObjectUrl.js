import { useEffect, useState } from 'react'

/**
 * Creates (and always revokes) an object URL for a selected File, so previews
 * can render images, video, audio and PDFs straight from the local bytes — no
 * upload, no server round trip.
 */
export function useObjectUrl(file) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return undefined
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])

  return url
}
