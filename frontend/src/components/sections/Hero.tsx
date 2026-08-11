import { useEffect, useRef, useState } from 'react'
import { HeroScene } from '../../three/hero/HeroScene'

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const [headroom, setHeadroom] = useState(0.1)

  useEffect(() => {
    const node = section.current
    if (!node) return

    const measure = () => {
      const height = node.clientHeight
      if (height <= 0) return
      const header = document.querySelector('header')?.offsetHeight ?? 64
      setHeadroom(Math.min(0.3, header / height))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={section}
      className="relative min-h-[42svh] overflow-hidden bg-ink grain grain-fade short:min-h-[62svh] md:min-h-[46svh]"
    >
      <HeroScene headroom={headroom} />

      <h1 className="sr-only">Unidragon — wooden puzzles cut one piece at a time</h1>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-ink via-ink/35 to-transparent md:h-20"
        aria-hidden
      />
    </section>
  )
}
