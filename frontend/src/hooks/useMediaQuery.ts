import { useEffect, useState } from 'react'

function getMatches(query: string) {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => getMatches(query))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQueryList = window.matchMedia(query)
    const update = () => setMatches(mediaQueryList.matches)
    update()

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', update)
    } else {
      mediaQueryList.addListener(update)
    }
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', update)
      } else {
        mediaQueryList.removeListener(update)
      }
    }
  }, [query])

  return matches
}
