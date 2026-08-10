import { Link } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS, priceFrom, productsIn } from '../../data/catalog'
import { formatPrice, useCart } from '../../store/cart'
import { ArtworkImage } from '../ui/ArtworkImage'
import { useReveal } from '../../lib/useReveal'

export function Collections() {
  const currency = useCart((s) => s.currency)
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="border-t border-ink-line py-24 md:py-32">
      <div className="container-page">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="eyebrow">Six ways in</p>
            <h2 className="mt-5 text-4xl md:text-5xl">Collections</h2>
          </div>
          <Link
            to="/shop"
            className="hidden shrink-0 text-sm text-paper/60 underline-offset-8 transition-colors hover:text-paper hover:underline sm:block"
          >
            All {PRODUCTS.length} puzzles
          </Link>
        </div>

        <div ref={ref} className="reveal mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection, index) => {
            const items = productsIn(collection.id)
            const lead = items[0]
            const from = items.length ? Math.min(...items.map(priceFrom)) : 0

            return (
              <Link
                key={collection.id}
                to={`/shop?collection=${collection.id}`}
                className="group block"
              >
                <div
                  className={[
                    'relative overflow-hidden rounded-sm bg-ink-soft',
                    // Staggered heights break the grid into something less catalogue-like.
                    index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-square',
                  ].join(' ')}
                >
                  {lead ? (
                    <ArtworkImage
                      artwork={lead.artwork}
                      ratio={index % 3 === 1 ? 4 / 5 : 1}
                      className="h-full w-full object-cover opacity-90 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : null}

                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-3xl">{collection.name}</h3>
                    <p className="mt-1 text-sm text-paper/55">{collection.note}</p>
                  </div>

                  <span
                    className="absolute left-6 top-6 h-2 w-2 rounded-full"
                    style={{ backgroundColor: collection.accent }}
                    aria-hidden
                  />
                </div>

                <p className="mt-3 flex items-baseline justify-between text-sm text-paper/45">
                  <span>{items.length} designs</span>
                  <span className="text-ember">from {formatPrice(from, currency)}</span>
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
