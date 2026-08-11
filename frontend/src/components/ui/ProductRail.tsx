import { Link } from 'react-router-dom'
import type { Product } from '../../data/catalog'
import { ProductCard } from './ProductCard'
import { useReveal } from '../../lib/useReveal'
import { useDragScroll } from '../../lib/useDragScroll'

function Arrow({ direction }: { direction: -1 | 1 }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d={direction === -1 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface ProductRailProps {
  eyebrow: string
  title: string
  products: Product[]
  /* Where the heading's escape hatch goes — the same cut of the catalogue. */
  to: string
  linkLabel: string
}

export function ProductRail({ eyebrow, title, products, to, linkLabel }: ProductRailProps) {
  const reveal = useReveal<HTMLDivElement>()
  const rail = useDragScroll<HTMLDivElement>()

  // nothing to come back for yet — a heading over an empty rail reads as a bug
  if (products.length === 0) return null

  /* A short row fits without scrolling, and dead controls are worse than none. */
  const scrolls = !(rail.edges.start && rail.edges.end)

  return (
    <section className="border-t border-ink-line py-24 md:py-32">
      <div className="container-page">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-5 text-4xl md:text-5xl">{title}</h2>
          </div>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link
              to={to}
              className="text-sm text-paper/60 underline-offset-8 transition-colors hover:text-paper hover:underline"
            >
              {linkLabel}
            </Link>
            {scrolls && (
              <div className="flex gap-1.5">
                {([-1, 1] as const).map((direction) => {
                  const atEdge = direction === -1 ? rail.edges.start : rail.edges.end
                  return (
                    <button
                      key={direction}
                      type="button"
                      onClick={() => rail.scrollByPage(direction)}
                      disabled={atEdge}
                      aria-label={direction === -1 ? 'Previous puzzles' : 'Next puzzles'}
                      className="grid h-9 w-9 place-items-center rounded-full border border-ink-line text-paper/70 transition-colors hover:border-paper/40 hover:text-paper disabled:opacity-25 disabled:hover:border-ink-line"
                    >
                      <Arrow direction={direction} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={rail.ref}
        onPointerDown={rail.onPointerDown}
        onDragStart={rail.onDragStart}
        onClickCapture={rail.onClickCapture}
        className={[
          'no-scrollbar mt-14 overflow-x-auto overscroll-x-contain pb-4',
          rail.dragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        ].join(' ')}
      >
        <div ref={reveal} className="reveal container-page flex gap-6 md:gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={[
                'w-[62vw] shrink-0 sm:w-[34vw] lg:w-[21vw]',
                index % 2 === 1 ? 'lg:pt-14' : '',
              ].join(' ')}
            >
              <ProductCard product={product} tall={index % 2 === 1} />
            </div>
          ))}
        </div>
      </div>

      {scrolls && (
        <p className="container-page mt-2 text-xs text-paper/30 sm:hidden">Swipe to see more</p>
      )}
    </section>
  )
}
