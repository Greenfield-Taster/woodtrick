import { lazy, Suspense, useEffect, useRef, useState } from 'react'

/*
 * The WebGL stack is a third of a megabyte, and it is the whole of what the
 * hero needs and none of what the page needs to be readable. Split off here,
 * it is fetched after the first paint rather than before it — the band holds
 * its height and its ground either way, so nothing moves when it arrives.
 */
const HeroScene = lazy(() =>
  import('../../three/hero/HeroScene').then((m) => ({ default: m.HeroScene })),
)

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
      <Suspense fallback={null}>
        <HeroScene headroom={headroom} />
      </Suspense>

      <h1 className="sr-only">Unidragon — wooden puzzles cut one piece at a time</h1>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-ink via-ink/35 to-transparent md:h-20"
        aria-hidden
      />
    </section>
  )
}
