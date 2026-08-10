import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Puts every route change back at the top of the page.
 *
 * A client-side router keeps the scroll position across navigations, so
 * following a product link from halfway down the catalogue drops you halfway
 * down the product page.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 'instant' rather than the smooth behaviour set globally on <html>:
    // scrolling a whole page back up in view of the visitor reads as a glitch.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
