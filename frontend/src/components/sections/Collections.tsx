import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS, priceFrom, productsIn } from '../../data/catalog'
import { formatPrice, useCart } from '../../store/cart'
import { ProductPhoto } from '../ui/ProductPhoto'
import { useReveal } from '../../lib/useReveal'

/*
 * The hero pieces need ~2.1s to fly together, and the catalogue now sits above
 * the fold beside them. On a fresh landing it holds until the wordmark is
 * nearly whole, then cascades in; arriving from a scroll it starts at once.
 */
const HERO_LEAD = 1.6
const TILE_STEP = 0.08

export function Collections() {
  const currency = useCart((s) => s.currency)
  const ref = useReveal<HTMLDivElement>()
  const [wait] = useState(() =>
    typeof window !== 'undefined' && window.scrollY < 200 ? HERO_LEAD : 0,
  )

  return (
    <section className="pt-14 pb-24 md:pt-16 md:pb-32">
      <div ref={ref} className="container-page reveal-stagger">
        <div className="flex items-end justify-between gap-8">
          <div className="reveal-item" style={{ transitionDelay: `${wait}s` }}>
            <p className="eyebrow">{COLLECTIONS.length} ways in</p>
            <h2 className="mt-5 text-4xl md:text-5xl">Collections</h2>
          </div>
          {PRODUCTS.length > 0 && (
            <div
              className="reveal-item hidden shrink-0 sm:block"
              style={{ transitionDelay: `${wait + TILE_STEP}s` }}
            >
              <Link
                to="/shop"
                className="text-sm text-paper/60 underline-offset-8 transition-colors hover:text-paper hover:underline"
              >
                All {PRODUCTS.length} puzzles
              </Link>
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection, index) => {
            const items = productsIn(collection.id)
            const lead = items[0]
            const from = items.length ? Math.min(...items.map(priceFrom)) : null

            return (
              <Link
                key={collection.id}
                to={`/shop?collection=${collection.id}`}
                className="reveal-item group block"
                style={{ transitionDelay: `${wait + (index + 2) * TILE_STEP}s` }}
              >
                {/*
                  The name sits under the frame, not over it. These photographs
                  are cut-outs drawn to contain, so the artwork stops wherever
                  its own shape does — a caption laid inside the frame lands on
                  the picture as often as it clears it.
                */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ink-soft">
                  {lead ? (
                    <div className="h-full w-full p-8 opacity-90 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-105 group-hover:opacity-100">
                      <ProductPhoto
                        src={lead.photo}
                        className="h-full w-full object-contain"
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      />
                    </div>
                  ) : null}

                  <span
                    className="absolute left-6 top-6 h-2 w-2 rounded-full"
                    style={{ backgroundColor: collection.accent }}
                    aria-hidden
                  />
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-2xl leading-none">{collection.name}</h3>
                  {from !== null && (
                    <span className="shrink-0 text-sm text-ember">
                      from {formatPrice(from, currency)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-snug text-paper/50">{collection.note}</p>
                <p className="mt-1.5 text-xs text-paper/35">
                  {items.length === 1 ? '1 design' : `${items.length} designs`}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
