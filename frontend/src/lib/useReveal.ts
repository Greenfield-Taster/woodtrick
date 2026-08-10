import { useEffect, useRef } from 'react'

/**
 * Reveals an element the first time it enters the viewport by flipping a data
 * attribute the `reveal` utility styles against. One observer per element, torn
 * down as soon as it has fired.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(rootMargin = '-12% 0px') {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (!('IntersectionObserver' in window)) {
      node.dataset.revealed = 'true'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.revealed = 'true'
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  return ref
}

/** Reports how far the element has travelled through the viewport, 0..1. */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  onProgress: (progress: number) => void,
) {
  const ref = useRef<T>(null)
  const callback = useRef(onProgress)
  callback.current = onProgress

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let frame = 0
    const measure = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const travelled = window.innerHeight - rect.top
      callback.current(Math.max(0, Math.min(1, travelled / total)))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return ref
}
