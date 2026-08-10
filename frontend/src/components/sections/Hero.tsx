import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeroScene } from '../../three/hero/HeroScene'

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const [reserve, setReserve] = useState({ top: 0.1, bottom: 0.3 })

  // The scene has to keep the word clear of the header above and this copy
  // below, and neither is a number worth guessing: the copy is three lines on
  // a desktop and six with stacked buttons on a small phone. Measure them.
  useEffect(() => {
    const measure = () => {
      if (!section.current || !copy.current) return
      const height = section.current.clientHeight
      if (height <= 0) return
      const header = document.querySelector('header')?.offsetHeight ?? 64
      setReserve({
        top: Math.min(0.3, header / height),
        bottom: Math.min(0.6, copy.current.offsetHeight / height),
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (section.current) observer.observe(section.current)
    if (copy.current) observer.observe(copy.current)
    return () => observer.disconnect()
  }, [])

  return (
    // The stage follows the page. The wordmark keeps its contrast by changing
    // wood rather than by keeping the ground dark — see STAGE in HeroScene.
    <section ref={section} className="relative min-h-[100svh] overflow-hidden bg-ink grain">
      <HeroScene reserve={reserve} />

      {/* The 3D pieces spell the name; the heading below carries it for
          screen readers and for anyone who never gets the canvas. */}
      <h1 className="sr-only">Unidragon — wooden puzzles cut one piece at a time</h1>

      {/* Settles the stage into the copy. It belongs under the copy, not over
          it: painted last it washed out the closing line and the second button,
          which only looked like restraint while the wash was the same near-black
          as the page. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent"
        aria-hidden
      />

      <div
        ref={copy}
        className="pointer-events-none absolute inset-x-0 bottom-0 pb-14 short:pb-6 md:pb-20"
      >
        <div className="container-page">
          <div className="grid gap-10 short:grid-cols-12 short:items-end short:gap-6 md:grid-cols-12 md:items-end">
            <p
              className="pointer-events-auto max-w-md text-balance text-lg leading-snug text-paper/80 opacity-0 short:col-span-6 short:text-base md:col-span-5 md:text-xl"
              style={{ animation: 'heroIn 1s var(--ease-out-soft) 2.15s forwards' }}
            >
              Laser-cut hardwood puzzles where no two pieces are alike — and every
              piece hides a second picture on its back.
            </p>

            <div
              className="pointer-events-auto flex flex-wrap items-center gap-3 opacity-0 short:col-span-5 short:col-start-8 short:justify-end md:col-span-4 md:col-start-9 md:justify-end"
              style={{ animation: 'heroIn 1s var(--ease-out-soft) 2.35s forwards' }}
            >
              <Link
                to="/shop"
                className="rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                Browse the catalogue
              </Link>
              <a
                href="#hidden"
                className="rounded-full border border-ink-line px-6 py-3 text-sm text-paper/80 transition-colors hover:border-paper/50 hover:text-paper"
              >
                See the hidden side
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(1.25rem); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes heroIn { from { opacity: 1 } to { opacity: 1 } }
        }
      `}</style>
    </section>
  )
}
