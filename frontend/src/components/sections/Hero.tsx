import { Link } from 'react-router-dom'
import { HeroScene } from '../../three/hero/HeroScene'

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden grain">
      <HeroScene />

      {/* The 3D pieces spell the name; the heading below carries it for
          screen readers and for anyone who never gets the canvas. */}
      <h1 className="sr-only">Unidragon — wooden puzzles cut one piece at a time</h1>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-14 md:pb-20">
        <div className="container-page">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <p
              className="pointer-events-auto max-w-md text-balance text-lg leading-snug text-paper/80 opacity-0 md:col-span-5 md:text-xl"
              style={{ animation: 'heroIn 1s var(--ease-out-soft) 2.15s forwards' }}
            >
              Laser-cut hardwood puzzles where no two pieces are alike — and every
              piece hides a second picture on its back.
            </p>

            <div
              className="pointer-events-auto flex flex-wrap items-center gap-3 opacity-0 md:col-span-4 md:col-start-9 md:justify-end"
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

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent"
        aria-hidden
      />

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
