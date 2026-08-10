import { useEffect, useRef, useState } from 'react'

export function useInViewport<T extends HTMLElement = HTMLDivElement>(margin = '200px') {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: margin,
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [margin])

  return { ref, visible }
}
